
drop policy if exists cp_public_cms_delete on storage.objects;
drop policy if exists cp_public_media_delete on storage.objects;
drop policy if exists cp_public_media_insert on storage.objects;
drop policy if exists cp_public_media_select on storage.objects;
drop policy if exists cp_public_media_update on storage.objects;
drop policy if exists cp_public_staff_delete on storage.objects;
drop policy if exists cp_public_staff_insert on storage.objects;
drop policy if exists cp_public_staff_select on storage.objects;
drop policy if exists cp_public_staff_update on storage.objects;

create policy cp_public_cms_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'cp-public'
  and exists (
    select 1
    from public.media_assets ma
    where ma.bucket = 'cp-public'
      and ma.path = objects.name
      and private.has_tenant_role(ma.tenant_id, array['owner','admin','editor','manager']::text[])
  )
);

create policy cp_public_media_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'cp-public'
  and array_length(storage.foldername(name), 1) = 2
  and (storage.foldername(name))[1] = 'media'
  and (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and private.has_tenant_role(((storage.foldername(name))[2])::uuid, array['owner','admin','editor','manager']::text[])
);

create policy cp_public_media_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'cp-public'
  and array_length(storage.foldername(name), 1) = 2
  and (storage.foldername(name))[1] = 'media'
  and (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and private.has_tenant_role(((storage.foldername(name))[2])::uuid, array['owner','admin','editor','manager']::text[])
);

create policy cp_public_media_select
on storage.objects for select to authenticated
using (
  bucket_id = 'cp-public'
  and array_length(storage.foldername(name), 1) = 2
  and (storage.foldername(name))[1] = 'media'
  and (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and private.has_tenant_role(((storage.foldername(name))[2])::uuid, array['owner','admin','editor','manager']::text[])
);

create policy cp_public_media_update
on storage.objects for update to authenticated
using (
  bucket_id = 'cp-public'
  and array_length(storage.foldername(name), 1) = 2
  and (storage.foldername(name))[1] = 'media'
  and (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and private.has_tenant_role(((storage.foldername(name))[2])::uuid, array['owner','admin','editor','manager']::text[])
)
with check (
  bucket_id = 'cp-public'
  and array_length(storage.foldername(name), 1) = 2
  and (storage.foldername(name))[1] = 'media'
  and (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and private.has_tenant_role(((storage.foldername(name))[2])::uuid, array['owner','admin','editor','manager']::text[])
);

create policy cp_public_staff_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'cp-public'
  and array_length(storage.foldername(name), 1) = 2
  and (storage.foldername(name))[1] = 'products'
  and exists (
    select 1
    from public.products p
    where p.id::text = (storage.foldername(objects.name))[2]
      and private.has_tenant_role(p.tenant_id, array['owner','admin','editor','manager']::text[])
  )
);

create policy cp_public_staff_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'cp-public'
  and array_length(storage.foldername(name), 1) = 2
  and (storage.foldername(name))[1] = 'products'
  and exists (
    select 1
    from public.products p
    where p.id::text = (storage.foldername(objects.name))[2]
      and private.has_tenant_role(p.tenant_id, array['owner','admin','editor','manager']::text[])
  )
);

create policy cp_public_staff_select
on storage.objects for select to authenticated
using (
  bucket_id = 'cp-public'
  and array_length(storage.foldername(name), 1) = 2
  and (storage.foldername(name))[1] = 'products'
  and exists (
    select 1
    from public.products p
    where p.id::text = (storage.foldername(objects.name))[2]
      and private.has_tenant_role(p.tenant_id, array['owner','admin','editor','manager']::text[])
  )
);

create policy cp_public_staff_update
on storage.objects for update to authenticated
using (
  bucket_id = 'cp-public'
  and array_length(storage.foldername(name), 1) = 2
  and (storage.foldername(name))[1] = 'products'
  and exists (
    select 1
    from public.products p
    where p.id::text = (storage.foldername(objects.name))[2]
      and private.has_tenant_role(p.tenant_id, array['owner','admin','editor','manager']::text[])
  )
)
with check (
  bucket_id = 'cp-public'
  and array_length(storage.foldername(name), 1) = 2
  and (storage.foldername(name))[1] = 'products'
  and exists (
    select 1
    from public.products p
    where p.id::text = (storage.foldername(objects.name))[2]
      and private.has_tenant_role(p.tenant_id, array['owner','admin','editor','manager']::text[])
  )
);
