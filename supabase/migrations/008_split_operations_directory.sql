create table if not exists public.drivers (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants on delete cascade,
  name text not null,
  company text,
  email text,
  phone text,
  preferred_method text not null default 'phone' check (preferred_method in ('email','phone','sms')),
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_providers (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants on delete cascade,
  name text not null,
  contact_name text,
  category text not null,
  email text,
  phone text,
  preferred_method text not null default 'phone' check (preferred_method in ('email','phone','sms')),
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.drivers enable row level security;
alter table public.service_providers enable row level security;
drop policy if exists "members see drivers" on public.drivers;
create policy "members see drivers" on public.drivers for select using(public.is_member(restaurant_id));
drop policy if exists "members see service providers" on public.service_providers;
create policy "members see service providers" on public.service_providers for select using(public.is_member(restaurant_id));
create index if not exists drivers_restaurant_active on public.drivers(restaurant_id,active);
create index if not exists service_providers_restaurant_active on public.service_providers(restaurant_id,active);

-- Move existing directory records to their proper domain tables without losing customer data.
insert into public.drivers (id,restaurant_id,name,email,phone,preferred_method,notes,active,created_at)
select id,restaurant_id,name,email,phone,preferred_method,notes,active,coalesce(created_at,now()) from public.vendors where kind='driver'
on conflict (id) do nothing;

insert into public.service_providers (id,restaurant_id,name,contact_name,category,email,phone,preferred_method,notes,active,created_at)
select id,restaurant_id,name,contact_name,category,email,phone,preferred_method,notes,active,coalesce(created_at,now()) from public.vendors where kind in ('service_provider','other')
on conflict (id) do nothing;

delete from public.vendors where kind in ('driver','service_provider','other');
alter table public.vendors drop constraint if exists vendors_kind_check;
alter table public.vendors drop column if exists kind;
