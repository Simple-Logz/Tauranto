create table if not exists public.manager_invites (
 id uuid primary key default gen_random_uuid(), restaurant_id uuid not null references public.restaurants on delete cascade,
 name text not null, email text not null, phone text, role public.member_role not null default 'manager', can_approve boolean not null default true,
 status text not null default 'pending' check(status in('pending','accepted','revoked')), invited_by uuid references public.profiles(id), created_at timestamptz not null default now(), accepted_at timestamptz,
 unique(restaurant_id,email)
);
alter table public.manager_invites enable row level security;
drop policy if exists "members see manager invites" on public.manager_invites;
create policy "members see manager invites" on public.manager_invites for select using(public.is_member(restaurant_id));
drop policy if exists "owners manage manager invites" on public.manager_invites;
create policy "owners manage manager invites" on public.manager_invites for all using(exists(select 1 from public.restaurant_members m where m.restaurant_id=manager_invites.restaurant_id and m.user_id=auth.uid() and m.active and m.role in('owner','admin'))) with check(exists(select 1 from public.restaurant_members m where m.restaurant_id=manager_invites.restaurant_id and m.user_id=auth.uid() and m.active and m.role in('owner','admin')));
create index if not exists manager_invites_restaurant on public.manager_invites(restaurant_id,status);
