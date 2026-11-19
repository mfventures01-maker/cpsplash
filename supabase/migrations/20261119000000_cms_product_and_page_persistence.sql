-- CP Splash CMS persistence hardening
-- This migration is intentionally staged on a repair branch. Do not apply to production
-- until the isolated migration and authenticated CMS E2E checks pass.

create or replace function public.cms_save_product(
  p_product_id uuid,
  p_product jsonb,
  p_variant jsonb default '{}'::jsonb,
  p_price jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_tenant_id uuid := '42d36cee-4cd6-43d1-af5d-334e5a07e37c'::uuid;
  v_product_id uuid;
  v_variant_id uuid;
  v_price_list_id uuid;
  v_price_id uuid;
  v_amount numeric;
  v_compare_at numeric;
  v_volume numeric;
  v_volume_unit text;
  v_product_status text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required to save CMS products' using errcode = '42501';
  end if;

  if not private.has_tenant_role(v_tenant_id, array['owner','admin','editor','manager']) then
    raise exception 'Insufficient CP Splash tenant permissions' using errcode = '42501';
  end if;

  if p_product is null or jsonb_typeof(p_product) <> 'object' then
    raise exception 'Product payload must be a JSON object' using errcode = '22023';
  end if;

  if nullif(btrim(p_product->>'name'), '') is null
     or nullif(btrim(p_product->>'slug'), '') is null then
    raise exception 'Product name and slug are required' using errcode = '22023';
  end if;

  if p_product_id is null then
    if not (p_price ? 'amount')
       or coalesce((p_price->>'amount')::numeric, 0) <= 0 then
      raise exception 'A positive initial product price is required' using errcode = '22023';
    end if;

    insert into public.products (
      tenant_id, category_id, name, slug, sku, brand, product_type,
      short_description, description, status, featured, seo_title,
      seo_description, metadata
    ) values (
      v_tenant_id,
      nullif(p_product->>'category_id','')::uuid,
      btrim(p_product->>'name'),
      lower(regexp_replace(trim(p_product->>'slug'), '[^a-zA-Z0-9]+', '-', 'g')),
      nullif(p_product->>'sku',''),
      nullif(p_product->>'brand',''),
      coalesce(nullif(p_product->>'product_type',''), 'physical'),
      nullif(p_product->>'short_description',''),
      nullif(p_product->>'description',''),
      coalesce(nullif(p_product->>'status',''), 'draft'),
      coalesce((p_product->>'featured')::boolean, false),
      coalesce(nullif(p_product->>'seo_title',''), btrim(p_product->>'name')),
      nullif(p_product->>'seo_description',''),
      coalesce(p_product->'metadata', '{}'::jsonb)
    ) returning id into v_product_id;
  else
    v_product_id := p_product_id;

    update public.products
       set name = case when p_product ? 'name' then btrim(p_product->>'name') else name end,
           slug = case when p_product ? 'slug' then lower(regexp_replace(trim(p_product->>'slug'), '[^a-zA-Z0-9]+', '-', 'g')) else slug end,
           category_id = case when p_product ? 'category_id' then nullif(p_product->>'category_id','')::uuid else category_id end,
           sku = case when p_product ? 'sku' then nullif(p_product->>'sku','') else sku end,
           brand = case when p_product ? 'brand' then nullif(p_product->>'brand','') else brand end,
           short_description = case when p_product ? 'short_description' then nullif(p_product->>'short_description','') else short_description end,
           description = case when p_product ? 'description' then nullif(p_product->>'description','') else description end,
           status = case when p_product ? 'status' then p_product->>'status' else status end,
           featured = case when p_product ? 'featured' then (p_product->>'featured')::boolean else featured end,
           seo_title = case when p_product ? 'seo_title' then nullif(p_product->>'seo_title','') else seo_title end,
           seo_description = case when p_product ? 'seo_description' then nullif(p_product->>'seo_description','') else seo_description end,
           metadata = case when p_product ? 'metadata' then p_product->'metadata' else metadata end,
           updated_at = now()
     where id = v_product_id and tenant_id = v_tenant_id;

    if not found then
      raise exception 'Product not found or tenant access denied' using errcode = 'P0002';
    end if;
  end if;

  select status into v_product_status
    from public.products
   where id = v_product_id and tenant_id = v_tenant_id;

  if p_variant is not null and p_variant <> '{}'::jsonb then
    select id into v_variant_id
      from public.product_variants
     where product_id = v_product_id and tenant_id = v_tenant_id
     order by case when status = 'active' then 0 else 1 end, created_at
     limit 1;

    v_volume := case when p_variant ? 'volume' then (p_variant->>'volume')::numeric else 500 end;
    v_volume_unit := coalesce(nullif(p_variant->>'volume_unit',''), 'ml');

    if v_variant_id is null then
      insert into public.product_variants (
        tenant_id, product_id, name, sku, volume, volume_unit, status, metadata
      ) values (
        v_tenant_id, v_product_id,
        coalesce(nullif(p_variant->>'name',''), 'Standard ' || v_volume::text || v_volume_unit),
        nullif(p_variant->>'sku',''),
        v_volume, v_volume_unit, 'active', '{}'::jsonb
      ) returning id into v_variant_id;
    else
      update public.product_variants
         set volume = case when p_variant ? 'volume' then (p_variant->>'volume')::numeric else volume end,
             volume_unit = case when p_variant ? 'volume_unit' then p_variant->>'volume_unit' else volume_unit end,
             name = case when p_variant ? 'name' then p_variant->>'name'
                         when p_variant ? 'volume' or p_variant ? 'volume_unit'
                         then 'Standard ' || coalesce((p_variant->>'volume')::numeric, volume)::text ||
                              coalesce(nullif(p_variant->>'volume_unit',''), volume_unit, 'ml')
                         else name end,
             updated_at = now()
       where id = v_variant_id and tenant_id = v_tenant_id;
    end if;
  else
    select id into v_variant_id
      from public.product_variants
     where product_id = v_product_id and tenant_id = v_tenant_id
       and status = 'active'
     order by created_at
     limit 1;
  end if;

  if v_variant_id is null and p_price is not null and p_price <> '{}'::jsonb then
    raise exception 'An active product variant is required before pricing' using errcode = 'P0002';
  end if;

  if p_price is not null and p_price <> '{}'::jsonb then
    select id into v_price_list_id
      from public.price_lists
     where tenant_id = v_tenant_id and name = 'Default Retail'
     limit 1;

    if v_price_list_id is null then
      insert into public.price_lists (tenant_id, name, currency, price_type, status)
      values (v_tenant_id, 'Default Retail', 'NGN', 'retail', 'active')
      on conflict (tenant_id, name) do update set status = 'active'
      returning id into v_price_list_id;
    end if;

    select id, amount, compare_at_amount
      into v_price_id, v_amount, v_compare_at
      from public.product_prices
     where tenant_id = v_tenant_id
       and price_list_id = v_price_list_id
       and variant_id = v_variant_id
       and status = 'active'
     order by created_at desc
     limit 1;

    if p_price ? 'amount' then
      v_amount := (p_price->>'amount')::numeric;
    end if;
    if p_price ? 'compare_at_amount' then
      v_compare_at := nullif(p_price->>'compare_at_amount','')::numeric;
    end if;

    if v_amount is null or v_amount <= 0 then
      raise exception 'Product price must be a positive number' using errcode = '22023';
    end if;
    if v_compare_at is not null and v_compare_at < v_amount then
      raise exception 'Compare-at price cannot be lower than the active price' using errcode = '22023';
    end if;

    if v_price_id is null then
      insert into public.product_prices (
        tenant_id, price_list_id, variant_id, amount, compare_at_amount,
        status, change_reason, created_by
      ) values (
        v_tenant_id, v_price_list_id, v_variant_id, v_amount, v_compare_at,
        'active', coalesce(nullif(p_price->>'change_reason',''), 'CMS product save'), auth.uid()
      );
    else
      update public.product_prices
         set amount = v_amount,
             compare_at_amount = v_compare_at,
             status = 'active',
             change_reason = coalesce(nullif(p_price->>'change_reason',''), 'CMS product save')
       where id = v_price_id and tenant_id = v_tenant_id;
    end if;
  end if;

  return v_product_id;
end;
$$;

revoke all on function public.cms_save_product(uuid, jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.cms_save_product(uuid, jsonb, jsonb, jsonb) to authenticated;

-- CMS Product Editor exposes price changes to editors, so the RLS policy must
-- agree with the UI permission model. Tenant membership remains mandatory.
drop policy if exists price_lists_staff_manage on public.price_lists;
create policy price_lists_staff_manage on public.price_lists
  for all to authenticated
  using (private.has_tenant_role(tenant_id, array['owner','admin','editor','manager']))
  with check (private.has_tenant_role(tenant_id, array['owner','admin','editor','manager']));

drop policy if exists prices_staff_manage on public.product_prices;
create policy prices_staff_manage on public.product_prices
  for all to authenticated
  using (private.has_tenant_role(tenant_id, array['owner','admin','editor','manager']))
  with check (private.has_tenant_role(tenant_id, array['owner','admin','editor','manager']));

-- Generic CMS page persistence. Page content is JSONB so existing React
-- page components can migrate incrementally without coupling storage to markup.
create table if not exists public.cms_pages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  slug text not null,
  path text not null,
  title text not null,
  template_key text not null default 'standard',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  content jsonb not null default '{}'::jsonb,
  seo_title text,
  seo_description text,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, slug),
  unique (tenant_id, path)
);

create table if not exists public.cms_page_sections (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  page_id uuid not null references public.cms_pages(id) on delete cascade,
  section_key text not null,
  section_type text not null,
  sort_order integer not null default 0,
  enabled boolean not null default true,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (page_id, section_key)
);

create index if not exists cms_pages_tenant_status_path_idx
  on public.cms_pages (tenant_id, status, path);
create index if not exists cms_page_sections_tenant_page_order_idx
  on public.cms_page_sections (tenant_id, page_id, sort_order);

alter table public.cms_pages enable row level security;
alter table public.cms_page_sections enable row level security;

drop policy if exists cms_pages_public_read on public.cms_pages;
create policy cms_pages_public_read on public.cms_pages
  for select to anon, authenticated
  using (
    status = 'published'
    and (published_at is null or published_at <= now())
    and exists (select 1 from public.tenants t where t.id = cms_pages.tenant_id and t.status = 'active')
  );

drop policy if exists cms_pages_staff_manage on public.cms_pages;
create policy cms_pages_staff_manage on public.cms_pages
  for all to authenticated
  using (private.has_tenant_role(tenant_id, array['owner','admin','editor','manager']))
  with check (private.has_tenant_role(tenant_id, array['owner','admin','editor','manager']));

drop policy if exists cms_page_sections_public_read on public.cms_page_sections;
create policy cms_page_sections_public_read on public.cms_page_sections
  for select to anon, authenticated
  using (
    enabled
    and exists (
      select 1 from public.cms_pages p
       where p.id = cms_page_sections.page_id
         and p.tenant_id = cms_page_sections.tenant_id
         and p.status = 'published'
         and (p.published_at is null or p.published_at <= now())
    )
  );

drop policy if exists cms_page_sections_staff_manage on public.cms_page_sections;
create policy cms_page_sections_staff_manage on public.cms_page_sections
  for all to authenticated
  using (private.has_tenant_role(tenant_id, array['owner','admin','editor','manager']))
  with check (
    private.has_tenant_role(tenant_id, array['owner','admin','editor','manager'])
    and exists (
      select 1 from public.cms_pages p
       where p.id = cms_page_sections.page_id and p.tenant_id = cms_page_sections.tenant_id
    )
  );
