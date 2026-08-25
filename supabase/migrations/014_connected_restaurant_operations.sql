-- Connected restaurant operations: team roles, reservations and inventory.
-- UI/API access remains server-side through the service role after membership checks.
alter table restaurant_members add column if not exists job_role text;
alter table restaurant_members add column if not exists display_name text;
alter table restaurant_members add column if not exists phone text;

create table if not exists reservations (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  table_id uuid references dining_tables(id) on delete set null,
  server_id uuid references auth.users(id) on delete set null,
  guest_name text not null,
  guest_phone text,
  party_size int not null default 2 check (party_size > 0),
  reserved_for timestamptz not null,
  duration_minutes int not null default 90,
  status text not null default 'booked' check(status in ('booked','confirmed','seated','completed','cancelled','no_show')),
  notes text,
  external_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists inventory_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name text not null,
  category text not null default 'General',
  unit text not null default 'unit',
  quantity numeric not null default 0,
  par_level numeric not null default 0,
  reorder_level numeric not null default 0,
  unit_cost numeric,
  supplier_id uuid,
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(restaurant_id,name)
);

create table if not exists inventory_events (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  item_id uuid not null references inventory_items(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  quantity_delta numeric not null default 0,
  quantity_after numeric,
  source text not null default 'app',
  reference_id text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_reservations_restaurant_time on reservations(restaurant_id,reserved_for desc);
create index if not exists idx_reservations_server on reservations(server_id,reserved_for desc);
create index if not exists idx_inventory_items_restaurant on inventory_items(restaurant_id,active,name);
create index if not exists idx_inventory_events_restaurant on inventory_events(restaurant_id,created_at desc);
create index if not exists idx_inventory_events_item on inventory_events(item_id,created_at desc);

alter table reservations enable row level security;
alter table inventory_items enable row level security;
alter table inventory_events enable row level security;
