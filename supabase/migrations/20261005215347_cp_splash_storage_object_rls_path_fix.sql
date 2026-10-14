-- RECOVERED FROM PRODUCTION MIGRATION LEDGER
-- Recorded version: 20261005215347
-- Recorded name: cp_splash_storage_object_rls_path_fix
-- Recovery status: reconstructed artifact; original repository provenance not yet verified.
-- DO NOT APPLY as a new migration.
-- Source: ledger JSON export supplied to this recovery script.

drop policy if exists \"cp_public_staff_insert\" on storage.objects;
drop policy if exists \"cp_public_staff_select\" on storage.objects;
drop policy if exists \"cp_public_staff_update\" on storage.objects;
drop policy if exists \"cp_public_staff_delete\" on storage.objects;

create policy \"cp_public_staff_insert\"
on storage.objects
for insert
to authenticated
with check (
  storage.objects.bucket_id = 'cp-public'
  and array_length(storage.foldername(storage.objects.name), 1) = 2
  and (storage.foldername(storage.objects.name))[1] = 'products'
  and exists (
    select 1
    from public.products p
    where p.id::text = (storage.foldername(storage.objects.name))[2]
      and public.has_tenant_role(
        p.tenant_id,
        array['owner','admin','editor','manager']::text[]
      )
  )
);

create policy \"cp_public_staff_select\"
on storage.objects
for select
to authenticated
using (
  storage.objects.bucket_id = 'cp-public'
  and array_length(storage.foldername(storage.objects.name), 1) = 2
  and (storage.foldername(storage.objects.name))[1] = 'products'
  and exists (
    select 1
    from public.products p
    where p.id::text = (storage.foldername(storage.objects.name))[2]
      and public.has_tenant_role(
        p.tenant_id,
        array['owner','admin','editor','manager']::text[]
      )
  )
);

create policy \"cp_public_staff_update\"
on storage.objects
for update
to authenticated
using (
  storage.objects.bucket_id = 'cp-public'
  and array_length(storage.foldername(storage.objects.name), 1) = 2
  and (storage.foldername(storage.objects.name))[1] = 'products'
  and exists (
    select 1
    from public.products p
    where p.id::text = (storage.foldername(storage.objects.name))[2]
      and public.has_tenant_role(
        p.tenant_id,
        array['owner','admin','editor','manager']::text[]
      )
  )
)
with check (
  storage.objects.bucket_id = 'cp-public'
  and array_length(storage.foldername(storage.objects.name), 1) = 2
  and (storage.foldername(storage.objects.name))[1] = 'products'
  and exists (
    select 1
    from public.products p
    where p.id::text = (storage.foldername(storage.objects.name))[2]
      and public.has_tenant_role(
        p.tenant_id,
        array['owner','admin','editor','manager']::text[]
      )
  )
);

create policy \"cp_public_staff_delete\"
on storage.objects
for delete
to authenticated
using (
  storage.objects.bucket_id = 'cp-public'
  and array_length(storage.foldername(storage.objects.name), 1) = 2
  and (storage.foldername(storage.objects.name))[1] = 'products'
  and exists (
    select 1
    from public.products p
    where p.id::text = (storage.foldername(storage.objects.name))[2]
      and public.has_tenant_role(
        p.tenant_id,
        array['owner','admin','editor','manager']::text[]
      )
  )
);

notify pgrst, 'reload schema';
