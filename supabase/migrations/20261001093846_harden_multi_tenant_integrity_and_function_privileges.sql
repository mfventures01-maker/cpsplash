-- RECOVERED FROM PRODUCTION MIGRATION LEDGER
-- Recorded version: 20261001093846
-- Recorded name: harden_multi_tenant_integrity_and_function_privileges
-- Recovery status: reconstructed artifact; original repository provenance not yet verified.
-- DO NOT APPLY as a new migration.
-- Source: ledger JSON export supplied to this recovery script.

revoke execute on function public.is_tenant_member(uuid) from anon, authenticated;
revoke execute on function public.has_tenant_role(uuid,text[]) from anon, authenticated;

create or replace function public.enforce_tenant_consistency()
returns trigger
language plpgsql
set search_path = public
as $$
declare parent_tenant uuid;
begin
  if tg_table_name = 'products' and new.category_id is not null then
    select tenant_id into parent_tenant from public.product_categories where id = new.category_id;
    if parent_tenant is distinct from new.tenant_id then
      raise exception 'Tenant mismatch: product and category must belong to the same tenant';
    end if;
  elsif tg_table_name = 'product_variants' then
    select tenant_id into parent_tenant from public.products where id = new.product_id;
    if parent_tenant is distinct from new.tenant_id then
      raise exception 'Tenant mismatch: variant and product must belong to the same tenant';
    end if;
  elsif tg_table_name = 'product_prices' then
    select tenant_id into parent_tenant from public.product_variants where id = new.variant_id;
    if parent_tenant is distinct from new.tenant_id then
      raise exception 'Tenant mismatch: price and variant must belong to the same tenant';
    end if;
    select tenant_id into parent_tenant from public.price_lists where id = new.price_list_id;
    if parent_tenant is distinct from new.tenant_id then
      raise exception 'Tenant mismatch: price and price list must belong to the same tenant';
    end if;
  elsif tg_table_name = 'product_media' then
    select tenant_id into parent_tenant from public.products where id = new.product_id;
    if parent_tenant is null then
      raise exception 'Product not found';
    end if;
    if not exists (select 1 from public.media_assets where id = new.media_id and tenant_id = parent_tenant) then
      raise exception 'Tenant mismatch: product and media must belong to the same tenant';
    end if;
  elsif tg_table_name = 'orders' then
    if new.store_id is not null then
      select tenant_id into parent_tenant from public.stores where id = new.store_id;
      if parent_tenant is distinct from new.tenant_id then
        raise exception 'Tenant mismatch: order and store must belong to the same tenant';
      end if;
    end if;
    if new.customer_id is not null then
      select tenant_id into parent_tenant from public.customers where id = new.customer_id;
      if parent_tenant is distinct from new.tenant_id then
        raise exception 'Tenant mismatch: order and customer must belong to the same tenant';
      end if;
    end if;
    if new.campaign_id is not null then
      select tenant_id into parent_tenant from public.campaigns where id = new.campaign_id;
      if parent_tenant is distinct from new.tenant_id then
        raise exception 'Tenant mismatch: order and campaign must belong to the same tenant';
      end if;
    end if;
  elsif tg_table_name = 'order_items' then
    select tenant_id into parent_tenant from public.orders where id = new.order_id;
    if parent_tenant is distinct from new.tenant_id then
      raise exception 'Tenant mismatch: order item and order must belong to the same tenant';
    end if;
    if new.product_id is not null then
      select tenant_id into parent_tenant from public.products where id = new.product_id;
      if parent_tenant is distinct from new.tenant_id then
        raise exception 'Tenant mismatch: order item and product must belong to the same tenant';
      end if;
    end if;
    if new.variant_id is not null then
      select tenant_id into parent_tenant from public.product_variants where id = new.variant_id;
      if parent_tenant is distinct from new.tenant_id then
        raise exception 'Tenant mismatch: order item and variant must belong to the same tenant';
      end if;
    end if;
  elsif tg_table_name = 'payments' then
    select tenant_id into parent_tenant from public.orders where id = new.order_id;
    if parent_tenant is distinct from new.tenant_id then
      raise exception 'Tenant mismatch: payment and order must belong to the same tenant';
    end if;
  elsif tg_table_name = 'inventory_items' then
    select tenant_id into parent_tenant from public.locations where id = new.location_id;
    if parent_tenant is distinct from new.tenant_id then
      raise exception 'Tenant mismatch: inventory and location must belong to the same tenant';
    end if;
    select tenant_id into parent_tenant from public.product_variants where id = new.variant_id;
    if parent_tenant is distinct from new.tenant_id then
      raise exception 'Tenant mismatch: inventory and variant must belong to the same tenant';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_products_tenant_consistency on public.products;
create trigger trg_products_tenant_consistency before insert or update on public.products
for each row execute function public.enforce_tenant_consistency();

drop trigger if exists trg_variants_tenant_consistency on public.product_variants;
create trigger trg_variants_tenant_consistency before insert or update on public.product_variants
for each row execute function public.enforce_tenant_consistency();

drop trigger if exists trg_prices_tenant_consistency on public.product_prices;
create trigger trg_prices_tenant_consistency before insert or update on public.product_prices
for each row execute function public.enforce_tenant_consistency();

drop trigger if exists trg_product_media_tenant_consistency on public.product_media;
create trigger trg_product_media_tenant_consistency before insert or update on public.product_media
for each row execute function public.enforce_tenant_consistency();

drop trigger if exists trg_orders_tenant_consistency on public.orders;
create trigger trg_orders_tenant_consistency before insert or update on public.orders
for each row execute function public.enforce_tenant_consistency();

drop trigger if exists trg_order_items_tenant_consistency on public.order_items;
create trigger trg_order_items_tenant_consistency before insert or update on public.order_items
for each row execute function public.enforce_tenant_consistency();

drop trigger if exists trg_payments_tenant_consistency on public.payments;
create trigger trg_payments_tenant_consistency before insert or update on public.payments
for each row execute function public.enforce_tenant_consistency();

drop trigger if exists trg_inventory_items_tenant_consistency on public.inventory_items;
create trigger trg_inventory_items_tenant_consistency before insert or update on public.inventory_items
for each row execute function public.enforce_tenant_consistency();
