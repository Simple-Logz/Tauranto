alter table public.execution_jobs add column if not exists execute_at timestamptz;
create index if not exists execution_jobs_execute_at on public.execution_jobs(status,execute_at);

create table if not exists public.vendors (
 id uuid primary key default gen_random_uuid(),
 restaurant_id uuid not null references public.restaurants on delete cascade,
 name text not null,
 email text,
 phone text,
 category text,
 notes text,
 active boolean not null default true,
 created_at timestamptz not null default now(),
 unique(restaurant_id,name)
);
alter table public.vendors enable row level security;
drop policy if exists "members see vendors" on public.vendors;
create policy "members see vendors" on public.vendors for select using(public.is_member(restaurant_id));
create index if not exists vendors_restaurant_name on public.vendors(restaurant_id,name);
