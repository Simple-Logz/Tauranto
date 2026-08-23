create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  category text not null default 'General',
  unit text not null default 'unit',
  quantity numeric not null default 0 check (quantity >= 0),
  par_level numeric not null default 0 check (par_level >= 0),
  reorder_level numeric not null default 0 check (reorder_level >= 0),
  unit_cost numeric null check (unit_cost is null or unit_cost >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists inventory_items_restaurant_idx on public.inventory_items(restaurant_id,active);
create unique index if not exists inventory_items_restaurant_name_idx on public.inventory_items(restaurant_id,lower(name)) where active=true;

create table if not exists public.inventory_events (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  item_id uuid not null references public.inventory_items(id) on delete cascade,
  actor_id uuid null references auth.users(id) on delete set null,
  event_type text not null,
  quantity_delta numeric null,
  quantity_after numeric null,
  note text null,
  created_at timestamptz not null default now()
);
create index if not exists inventory_events_restaurant_idx on public.inventory_events(restaurant_id,created_at desc);
create index if not exists inventory_events_item_idx on public.inventory_events(item_id,created_at desc);

alter table public.inventory_items enable row level security;
alter table public.inventory_events enable row level security;

drop policy if exists inventory_items_member_read on public.inventory_items;
create policy inventory_items_member_read on public.inventory_items for select to authenticated using (
  exists(select 1 from public.restaurant_members m where m.restaurant_id=inventory_items.restaurant_id and m.user_id=auth.uid() and m.active=true)
);
drop policy if exists inventory_events_member_read on public.inventory_events;
create policy inventory_events_member_read on public.inventory_events for select to authenticated using (
  exists(select 1 from public.restaurant_members m where m.restaurant_id=inventory_events.restaurant_id and m.user_id=auth.uid() and m.active=true)
);
