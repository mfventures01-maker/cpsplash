-- RECOVERED FROM PRODUCTION MIGRATION LEDGER
-- Recorded version: 20261001093826
-- Recorded name: create_multi_tenant_ecommerce_engine
-- Recovery status: reconstructed artifact; original repository provenance not yet verified.
-- DO NOT APPLY as a new migration.
-- Source: ledger JSON export supplied to this recovery script.

create extension if not exists pgcrypto;

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  legal_name text,
  status text not null default 'active' check (status in ('active','suspended','archived')),
  default_currency char(3) not null default 'NGN',
  default_country text not null default 'NG',
  timezone text not null default 'Africa/Lagos',
  logo_url text,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  name text not null,
  permissions jsonb not null default '{}'::jsonb,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  unique (tenant_id, name)
);

create table public.tenant_memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references public.roles(id),
  status text not null default 'active' check (status in ('invited','active','suspended','removed')),
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  slug text not null,
  code text,
  phone text,
  whatsapp text,
  address text,
  city text,
  state text,
  country text default 'NG',
  latitude numeric(9,6),
  longitude numeric(9,6),
  status text not null default 'active' check (status in ('active','inactive')),
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, slug)
);

create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  parent_id uuid references public.product_categories(id) on delete set null,
  name text not null,
  slug text not null,
  description text,
  image_url text,
  sort_order integer not null default 0,
  status text not null default 'published' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, slug)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  category_id uuid references public.product_categories(id) on delete set null,
  name text not null,
  slug text not null,
  sku text,
  brand text,
  product_type text not null default 'physical',
  short_description text,
  description text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  featured boolean not null default false,
  seo_title text,
  seo_description text,
  seo_keywords text[],
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, slug),
  unique (tenant_id, sku)
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  sku text,
  barcode text,
  volume numeric,
  volume_unit text,
  weight numeric,
  weight_unit text,
  status text not null default 'active' check (status in ('draft','active','inactive')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, sku)
);

create table public.price_lists (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  currency char(3) not null default 'NGN',
  price_type text not null default 'retail' check (price_type in ('retail','wholesale','promo','custom')),
  status text not null default 'active' check (status in ('draft','active','inactive')),
  valid_from timestamptz,
  valid_to timestamptz,
  created_at timestamptz not null default now(),
  unique (tenant_id, name)
);

create table public.product_prices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  price_list_id uuid not null references public.price_lists(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  amount numeric(14,2) not null check (amount >= 0),
  compare_at_amount numeric(14,2) check (compare_at_amount is null or compare_at_amount >= amount),
  status text not null default 'active' check (status in ('draft','active','inactive')),
  valid_from timestamptz,
  valid_to timestamptz,
  change_reason text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  bucket text not null,
  path text not null,
  media_type text not null check (media_type in ('image','video','audio','document')),
  mime_type text,
  filename text,
  size_bytes bigint,
  width integer,
  height integer,
  duration_seconds numeric,
  alt_text text,
  caption text,
  status text not null default 'active' check (status in ('pending','active','archived')),
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (tenant_id, bucket, path)
);

create table public.product_media (
  product_id uuid not null references public.products(id) on delete cascade,
  media_id uuid not null references public.media_assets(id) on delete cascade,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (product_id, media_id)
);

create table public.product_claims (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  claim text not null,
  claim_type text not null default 'marketing',
  evidence_source text,
  verification_status text not null default 'pending' check (verification_status in ('pending','verified','rejected')),
  verified_by uuid references auth.users(id) on delete set null,
  verified_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete set null,
  name text not null,
  phone text,
  email text,
  whatsapp text,
  marketing_consent boolean not null default false,
  status text not null default 'active' check (status in ('active','inactive','blocked')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  label text,
  recipient_name text,
  phone text,
  address_line text not null,
  city text,
  state text,
  country text not null default 'NG',
  latitude numeric(9,6),
  longitude numeric(9,6),
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  store_id uuid references public.stores(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  order_number text not null,
  channel text not null default 'web' check (channel in ('web','whatsapp','instagram','retail','phone','admin')),
  status text not null default 'pending' check (status in ('pending','confirmed','processing','fulfilled','cancelled','refunded')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','pending','paid','failed','refunded')),
  fulfillment_status text not null default 'unfulfilled' check (fulfillment_status in ('unfulfilled','processing','ready','shipped','delivered','cancelled')),
  currency char(3) not null default 'NGN',
  subtotal numeric(14,2) not null default 0 check (subtotal >= 0),
  discount_total numeric(14,2) not null default 0 check (discount_total >= 0),
  delivery_fee numeric(14,2) not null default 0 check (delivery_fee >= 0),
  tax_total numeric(14,2) not null default 0 check (tax_total >= 0),
  grand_total numeric(14,2) not null default 0 check (grand_total >= 0),
  notes text,
  source text,
  campaign_id uuid,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, order_number)
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name_snapshot text not null,
  sku_snapshot text,
  unit_price numeric(14,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  discount numeric(14,2) not null default 0 check (discount >= 0),
  line_total numeric(14,2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null,
  reference text,
  amount numeric(14,2) not null check (amount >= 0),
  currency char(3) not null default 'NGN',
  method text,
  status text not null default 'pending' check (status in ('pending','successful','failed','refunded')),
  metadata jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique (tenant_id, provider, reference)
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,
  name text not null,
  location_type text not null default 'warehouse' check (location_type in ('store','warehouse','hub','production','stockist','pickup')),
  address text,
  city text,
  state text,
  country text not null default 'NG',
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  unique (tenant_id, name)
);

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  quantity_on_hand integer not null default 0,
  quantity_reserved integer not null default 0,
  reorder_level integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, location_id, variant_id),
  check (quantity_reserved >= 0 and quantity_reserved <= quantity_on_hand)
);

create table public.inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete restrict,
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  transaction_type text not null check (transaction_type in ('purchase','production','sale','reservation','release','adjustment','transfer_in','transfer_out','return','damage')),
  quantity integer not null,
  reference_type text,
  reference_id uuid,
  reason text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.inventory_transfers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  from_location_id uuid not null references public.locations(id),
  to_location_id uuid not null references public.locations(id),
  status text not null default 'draft' check (status in ('draft','in_transit','received','cancelled')),
  reference text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  check (from_location_id <> to_location_id)
);

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  title text not null,
  slug text not null,
  excerpt text,
  content text not null,
  featured_media_id uuid references public.media_assets(id) on delete set null,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  published_at timestamptz,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, slug)
);

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  status text not null default 'draft' check (status in ('draft','active','paused','completed')),
  starts_at timestamptz,
  ends_at timestamptz,
  landing_path text,
  default_utm_source text,
  default_utm_medium text,
  default_utm_campaign text,
  created_at timestamptz not null default now(),
  unique (tenant_id, slug)
);

create table public.influencers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  handle text,
  platform text,
  profile_url text,
  phone text,
  email text,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now()
);

create table public.social_content (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  influencer_id uuid references public.influencers(id) on delete set null,
  platform text not null,
  external_post_id text,
  url text,
  caption text,
  status text not null default 'draft' check (status in ('draft','scheduled','published','archived')),
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.retailers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  phone text,
  whatsapp text,
  address text,
  city text,
  state text,
  country text not null default 'NG',
  latitude numeric(9,6),
  longitude numeric(9,6),
  verification_status text not null default 'pending' check (verification_status in ('pending','verified','rejected')),
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now()
);

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  session_id text,
  customer_id uuid references public.customers(id) on delete set null,
  event_name text not null,
  product_id uuid references public.products(id) on delete set null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  page_path text,
  source text,
  medium text,
  campaign text,
  content text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

alter table public.orders
  add constraint orders_campaign_fk foreign key (campaign_id) references public.campaigns(id) on delete set null;

create index idx_memberships_user on public.tenant_memberships(user_id);
create index idx_memberships_tenant on public.tenant_memberships(tenant_id);
create index idx_products_tenant_status on public.products(tenant_id,status);
create index idx_variants_product on public.product_variants(product_id);
create index idx_prices_variant_status on public.product_prices(variant_id,status);
create index idx_orders_tenant_created on public.orders(tenant_id,created_at desc);
create index idx_order_items_order on public.order_items(order_id);
create index idx_inventory_variant on public.inventory_items(variant_id);
create index idx_events_tenant_created on public.analytics_events(tenant_id,created_at desc);

create or replace function public.is_tenant_member(_tenant_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_memberships tm
    where tm.tenant_id = _tenant_id
      and tm.user_id = auth.uid()
      and tm.status = 'active'
  );
$$;

create or replace function public.has_tenant_role(_tenant_id uuid, _role_names text[])
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_memberships tm
    join public.roles r on r.id = tm.role_id
    where tm.tenant_id = _tenant_id
      and tm.user_id = auth.uid()
      and tm.status = 'active'
      and r.name = any(_role_names)
  );
$$;

revoke execute on function public.is_tenant_member(uuid) from public;
revoke execute on function public.has_tenant_role(uuid,text[]) from public;
grant execute on function public.is_tenant_member(uuid) to authenticated;
grant execute on function public.has_tenant_role(uuid,text[]) to authenticated;

alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.tenant_memberships enable row level security;
alter table public.stores enable row level security;
alter table public.product_categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.price_lists enable row level security;
alter table public.product_prices enable row level security;
alter table public.media_assets enable row level security;
alter table public.product_media enable row level security;
alter table public.product_claims enable row level security;
alter table public.customers enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.locations enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_transactions enable row level security;
alter table public.inventory_transfers enable row level security;
alter table public.blog_posts enable row level security;
alter table public.campaigns enable row level security;
alter table public.influencers enable row level security;
alter table public.social_content enable row level security;
alter table public.retailers enable row level security;
alter table public.analytics_events enable row level security;
alter table public.audit_logs enable row level security;

create policy tenant_public_select on public.tenants
for select using (status = 'active');

create policy tenant_member_manage on public.tenants
for all to authenticated
using (has_tenant_role(id, array['owner','admin']))
with check (has_tenant_role(id, array['owner','admin']));

create policy profile_self on public.profiles
for all to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy roles_member_select on public.roles
for select to authenticated
using (tenant_id is null or is_tenant_member(tenant_id));

create policy roles_admin_manage on public.roles
for all to authenticated
using (tenant_id is not null and has_tenant_role(tenant_id, array['owner','admin']))
with check (tenant_id is not null and has_tenant_role(tenant_id, array['owner','admin']));

create policy membership_member_select on public.tenant_memberships
for select to authenticated
using (is_tenant_member(tenant_id));

create policy membership_admin_manage on public.tenant_memberships
for all to authenticated
using (has_tenant_role(tenant_id, array['owner','admin']))
with check (has_tenant_role(tenant_id, array['owner','admin']));

create policy stores_public_select on public.stores
for select using (status = 'active');

create policy stores_admin_manage on public.stores
for all to authenticated
using (has_tenant_role(tenant_id, array['owner','admin','manager']))
with check (has_tenant_role(tenant_id, array['owner','admin','manager']));

create policy categories_public_select on public.product_categories
for select using (status = 'published');

create policy categories_staff_manage on public.product_categories
for all to authenticated
using (has_tenant_role(tenant_id, array['owner','admin','editor','manager']))
with check (has_tenant_role(tenant_id, array['owner','admin','editor','manager']));

create policy products_public_select on public.products
for select using (status = 'published');

create policy products_staff_manage on public.products
for all to authenticated
using (has_tenant_role(tenant_id, array['owner','admin','editor','manager']))
with check (has_tenant_role(tenant_id, array['owner','admin','editor','manager']));

create policy variants_public_select on public.product_variants
for select using (
  status = 'active'
  and exists (
    select 1 from public.products p
    where p.id = product_id and p.status = 'published'
  )
);

create policy variants_staff_manage on public.product_variants
for all to authenticated
using (has_tenant_role(tenant_id, array['owner','admin','editor','manager']))
with check (has_tenant_role(tenant_id, array['owner','admin','editor','manager']));

create policy price_lists_public_select on public.price_lists
for select using (status = 'active');

create policy price_lists_staff_manage on public.price_lists
for all to authenticated
using (has_tenant_role(tenant_id, array['owner','admin','manager']))
with check (has_tenant_role(tenant_id, array['owner','admin','manager']));

create policy prices_public_select on public.product_prices
for select using (
  status = 'active'
  and (valid_from is null or valid_from <= now())
  and (valid_to is null or valid_to > now())
  and exists (
    select 1
    from public.product_variants v
    join public.products p on p.id = v.product_id
    where v.id = variant_id and v.status = 'active' and p.status = 'published'
  )
);

create policy prices_staff_manage on public.product_prices
for all to authenticated
using (has_tenant_role(tenant_id, array['owner','admin','manager']))
with check (has_tenant_role(tenant_id, array['owner','admin','manager']));

create policy media_public_select on public.media_assets
for select using (status = 'active');

create policy media_staff_manage on public.media_assets
for all to authenticated
using (has_tenant_role(tenant_id, array['owner','admin','editor','manager']))
with check (has_tenant_role(tenant_id, array['owner','admin','editor','manager']));

create policy product_media_public_select on public.product_media
for select using (
  exists (
    select 1 from public.products p
    where p.id = product_id and p.status = 'published'
  )
);

create policy product_media_staff_manage on public.product_media
for all to authenticated
using (
  exists (
    select 1 from public.products p
    where p.id = product_id
      and has_tenant_role(p.tenant_id, array['owner','admin','editor','manager'])
  )
)
with check (
  exists (
    select 1 from public.products p
    where p.id = product_id
      and has_tenant_role(p.tenant_id, array['owner','admin','editor','manager'])
  )
);

create policy claims_public_select on public.product_claims
for select using (
  verification_status = 'verified'
  and exists (
    select 1 from public.products p where p.id = product_id and p.status = 'published'
  )
);

create policy claims_staff_manage on public.product_claims
for all to authenticated
using (has_tenant_role(tenant_id, array['owner','admin','editor','manager']))
with check (has_tenant_role(tenant_id, array['owner','admin','editor','manager']));

create policy customers_staff_manage on public.customers
for all to authenticated
using (has_tenant_role(tenant_id, array['owner','admin','manager','sales']))
with check (has_tenant_role(tenant_id, array['owner','admin','manager','sales']));

create policy addresses_staff_manage on public.customer_addresses
for all to authenticated
using (has_tenant_role(tenant_id, array['owner','admin','manager','sales']))
with check (has_tenant_role(tenant_id, array['owner','admin','manager','sales']));

create policy orders_staff_manage on public.orders
for all to authenticated
using (has_tenant_role(tenant_id, array['owner','admin','manager','sales']))
with check (has_tenant_role(tenant_id, array['owner','admin','manager','sales']));

create policy order_items_staff_manage on public.order_items
for all to authenticated
using (has_tenant_role(tenant_id, array['owner','admin','manager','sales']))
with check (has_tenant_role(tenant_id, array['owner','admin','manager','sales']));

create policy payments_staff_manage on public.payments
for all to authenticated
using (has_tenant_role(tenant_id, array['owner','admin','manager']))
with check (has_tenant_role(tenant_id, array['owner','admin','manager']));

create policy locations_staff_manage on public.locations
for all to authenticated
using (has_tenant_role(tenant_id, array['owner','admin','manager']))
with check (has_tenant_role(tenant_id, array['owner','admin','manager']));

create policy inventory_staff_manage on public.inventory_items
for all to authenticated
using (has_tenant_role(tenant_id, array['owner','admin','manager','inventory']))
with check (has_tenant_role(tenant_id, array['owner','admin','manager','inventory']));

create policy inventory_transactions_staff_manage on public.inventory_transactions
for all to authenticated
using (has_tenant_role(tenant_id, array['owner','admin','manager','inventory']))
with check (has_tenant_role(tenant_id, array['owner','admin','manager','inventory']));

create policy inventory_transfers_staff_manage on public.inventory_transfers
for all to authenticated
using (has_tenant_role(tenant_id, array['owner','admin','manager','inventory']))
with check (has_tenant_role(tenant_id, array['owner','admin','manager','inventory']));

create policy blog_public_select on public.blog_posts
for select using (status = 'published' and (published_at is null or published_at <= now()));

create policy blog_staff_manage on public.blog_posts
for all to authenticated
using (has_tenant_role(tenant_id, array['owner','admin','editor','manager']))
with check (has_tenant_role(tenant_id, array['owner','admin','editor','manager']));

create policy campaigns_public_select on public.campaigns
for select using (status = 'active');

create policy campaigns_staff_manage on public.campaigns
for all to authenticated
using (has_tenant_role(tenant_id, array['owner','admin','editor','manager']))
with check (has_tenant_role(tenant_id, array['owner','admin','editor','manager']));

create policy influencers_staff_manage on public.influencers
for all to authenticated
using (has_tenant_role(tenant_id, array['owner','admin','editor','manager']))
with check (has_tenant_role(tenant_id, array['owner','admin','editor','manager']));

create policy social_staff_manage on public.social_content
for all to authenticated
using (has_tenant_role(tenant_id, array['owner','admin','editor','manager']))
with check (has_tenant_role(tenant_id, array['owner','admin','editor','manager']));

create policy retailers_public_select on public.retailers
for select using (status = 'active' and verification_status = 'verified');

create policy retailers_staff_manage on public.retailers
for all to authenticated
using (has_tenant_role(tenant_id, array['owner','admin','manager']))
with check (has_tenant_role(tenant_id, array['owner','admin','manager']));

create policy analytics_staff_insert on public.analytics_events
for insert to authenticated
with check (has_tenant_role(tenant_id, array['owner','admin','manager','marketing','sales']));

create policy analytics_staff_select on public.analytics_events
for select to authenticated
using (has_tenant_role(tenant_id, array['owner','admin','manager','marketing','sales']));

create policy audit_staff_select on public.audit_logs
for select to authenticated
using (tenant_id is null or has_tenant_role(tenant_id, array['owner','admin']));

insert into public.roles (tenant_id,name,permissions,is_system)
values
  (null,'owner','{\"all\":true}',true),
  (null,'admin','{\"all\":true}',true),
  (null,'manager','{\"catalog\":true,\"orders\":true,\"inventory\":true}',true),
  (null,'editor','{\"catalog\":true,\"content\":true}',true),
  (null,'sales','{\"orders\":true,\"customers\":true}',true),
  (null,'inventory','{\"inventory\":true}',true),
  (null,'marketing','{\"content\":true,\"campaigns\":true,\"analytics\":true}',true)
on conflict do nothing;

insert into public.tenants (name,slug,legal_name,default_currency,default_country,timezone,status)
values
  ('CP Fruit Splash','cp-splash','CP Fruit Splash','NGN','NG','Africa/Lagos','active'),
  ('Linos E Security','linos-e-security','Linos E Security','NGN','NG','Africa/Lagos','active')
on conflict (slug) do nothing;
