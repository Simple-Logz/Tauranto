create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  description text not null default '',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, name)
);

create table if not exists public.department_members (
  department_id uuid not null references public.departments(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (department_id, user_id)
);

create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  requested_by uuid not null references public.profiles(id) on delete cascade,
  email text not null,
  subject text not null,
  message text not null,
  status text not null default 'open' check (status in ('open','in_progress','resolved','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.restaurant_preferences add column if not exists appearance text not null default 'light' check (appearance in ('light','dark'));
create index if not exists departments_restaurant_idx on public.departments(restaurant_id);
create index if not exists department_members_restaurant_idx on public.department_members(restaurant_id);
create index if not exists support_requests_restaurant_idx on public.support_requests(restaurant_id, created_at desc);

alter table public.departments enable row level security;
alter table public.department_members enable row level security;
alter table public.support_requests enable row level security;

drop policy if exists departments_member_access on public.departments;
create policy departments_member_access on public.departments for all to authenticated
using (public.is_member(restaurant_id)) with check (public.is_member(restaurant_id));
drop policy if exists department_members_member_access on public.department_members;
create policy department_members_member_access on public.department_members for all to authenticated
using (public.is_member(restaurant_id)) with check (public.is_member(restaurant_id));
drop policy if exists support_requests_member_access on public.support_requests;
create policy support_requests_member_access on public.support_requests for all to authenticated
using (public.is_member(restaurant_id)) with check (public.is_member(restaurant_id));

grant select, insert, update, delete on public.departments to authenticated;
grant select, insert, update, delete on public.department_members to authenticated;
grant select, insert, update on public.support_requests to authenticated;
