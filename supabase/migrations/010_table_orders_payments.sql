-- Table orders and restaurant payment configuration
alter table guest_sessions add column if not exists order_items jsonb not null default '[]'::jsonb;
alter table guest_sessions add column if not exists order_notes text;
alter table guest_sessions add column if not exists order_total numeric(12,2);
alter table guest_sessions add column if not exists payment_status text not null default 'not_requested' check(payment_status in ('not_requested','ready','link_created','sent','paid','failed'));
alter table guest_sessions add column if not exists payment_url text;

create table if not exists restaurant_payment_settings (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null unique references restaurants(id) on delete cascade,
  provider text not null default 'hosted_link',
  display_name text not null default 'Restaurant payment',
  checkout_base_url text,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table restaurant_payment_settings enable row level security;
create index if not exists idx_payment_settings_restaurant on restaurant_payment_settings(restaurant_id);
-- API verifies restaurant membership and uses the service role. Raw card data is never stored by Tauranto.
