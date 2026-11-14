-- Atomic product-media primary switching.
-- Fail closed if historical data already violates the one-primary invariant;
-- do not silently choose or rewrite a production primary during migration.
do $$
begin
  if exists (
    select 1
    from public.product_media
    where is_primary
    group by product_id
    having count(*) > 1
  ) then
    raise exception
      'Cannot create product_media one-primary index: duplicate primary rows exist. Reconcile them explicitly before applying this migration.';
  end if;
end;
$$;

create unique index if not exists product_media_one_primary_per_product
  on public.product_media (product_id)
  where is_primary = true;

create or replace function public.set_product_primary_media(
  p_product_id uuid,
  p_media_id uuid,
  p_create_link boolean default false,
  p_sort_order integer default null
)
returns setof public.product_media
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_actor_id uuid;
  v_tenant_id uuid;
  v_asset_tenant_id uuid;
  v_asset_status text;
begin
  v_actor_id := auth.uid();
  if v_actor_id is null then
    raise exception 'Authentication required to change product primary media'
      using errcode = '42501';
  end if;

  -- Serialize all primary changes for the same product. The partial unique
  -- index additionally protects the invariant from non-RPC write paths.
  select p.tenant_id
    into v_tenant_id
  from public.products p
  where p.id = p_product_id
  for update;

  if v_tenant_id is null then
    raise exception 'Product not found';
  end if;

  if not exists (
    select 1
    from public.tenant_memberships tm
    join public.roles r on r.id = tm.role_id
    where tm.tenant_id = v_tenant_id
      and tm.user_id = v_actor_id
      and tm.status = 'active'
      -- Memberships may reference tenant-scoped roles or the seeded global
      -- system roles. Never accept a role belonging to a different tenant.
      and (r.tenant_id is null or r.tenant_id = v_tenant_id)
      and r.name = any (array['owner','admin','editor','manager']::text[])
  ) then
    raise exception 'Not authorized to manage product media'
      using errcode = '42501';
  end if;

  select ma.tenant_id, ma.status
    into v_asset_tenant_id, v_asset_status
  from public.media_assets ma
  where ma.id = p_media_id
  for share;

  if v_asset_tenant_id is null
     or v_asset_tenant_id <> v_tenant_id
     or v_asset_status <> 'active' then
    raise exception 'Media asset not found, inactive, or outside product tenant';
  end if;

  if not p_create_link and not exists (
    select 1
    from public.product_media pm
    where pm.product_id = p_product_id
      and pm.media_id = p_media_id
  ) then
    raise exception 'Media asset is not linked to this product';
  end if;

  -- Both operations execute in this transaction. Any later failure rolls
  -- back this clear, preserving the previous primary assignment.
  update public.product_media
     set is_primary = false
   where product_id = p_product_id
     and media_id <> p_media_id
     and is_primary = true;

  if p_create_link then
    insert into public.product_media as current_link (product_id, media_id, sort_order, is_primary)
    values (p_product_id, p_media_id, coalesce(p_sort_order, 0), true)
    on conflict (product_id, media_id)
    do update set
      is_primary = true,
      sort_order = case
        when p_sort_order is null then current_link.sort_order
        else excluded.sort_order
      end;
  else
    update public.product_media
       set is_primary = true
     where product_id = p_product_id
       and media_id = p_media_id;
  end if;

  return query
    select pm.*
    from public.product_media pm
    where pm.product_id = p_product_id
      and pm.media_id = p_media_id
      and pm.is_primary = true;
end;
$$;

revoke all on function public.set_product_primary_media(uuid, uuid, boolean, integer)
  from public, anon;
grant execute on function public.set_product_primary_media(uuid, uuid, boolean, integer)
  to authenticated;
