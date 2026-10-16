-- RECOVERED FROM PRODUCTION MIGRATION LEDGER
-- Recorded version: 20261005215338
-- Recorded name: cp_splash_storage_object_rls
-- Recovery status: reconstructed artifact; original repository provenance not yet verified.
-- DO NOT APPLY as a new migration.
-- Source: ledger JSON export supplied to this recovery script.

create policy "cp_public_staff_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'cp-public'
  and array_length(storage.foldername(name), 1) = 2
  and (storage.foldername(name))[1] = 'products'
  and exists (
    select 1
    from public.products p
    where p.id::text = (storage.foldername(name))[2]
      and public.has_tenant_role(
        p.tenant_id,
        array['owner','admin','editor','manager']::text[]
      )
  )
);

create policy "cp_public_staff_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'cp-public'
  and array_length(storage.foldername(name), 1) = 2
  and (storage.foldername(name))[1] = 'products'
  and exists (
    select 1
    from public.products p
    where p.id::text = (storage.foldername(name))[2]
      and public.has_tenant_role(
        p.tenant_id,
        array['owner','admin','editor','manager']::text[]
      )
  )
);

create policy "cp_public_staff_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'cp-public'
  and array_length(storage.foldername(name), 1) = 2
  and (storage.foldername(name))[1] = 'products'
  and exists (
    select 1
    from public.products p
    where p.id::text = (storage.foldername(name))[2]
      and public.has_tenant_role(
        p.tenant_id,
        array['owner','admin','editor','manager']::text[]
      )
  )
)
with check (
  bucket_id = 'cp-public'
  and array_length(storage.foldername(name), 1) = 2
  and (storage.foldername(name))[1] = 'products'
  and exists (
    select 1
    from public.products p
    where p.id::text = (storage.foldername(name))[2]
      and public.has_tenant_role(
        p.tenant_id,
        array['owner','admin','editor','manager']::text[]
      )
  )
);

create policy "cp_public_staff_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'cp-public'
  and array_length(storage.foldername(name), 1) = 2
  and (storage.foldername(name))[1] = 'products'
  and exists (
    select 1
    from public.products p
    where p.id::text = (storage.foldername(name))[2]
      and public.has_tenant_role(
        p.tenant_id,
        array['owner','admin','editor','manager']::text[]
      )
  )
);

notify pgrst, 'reload schema';
