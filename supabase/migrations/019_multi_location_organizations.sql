-- Multi-location support: group restaurants that belong to the same chain
-- under an organization, so a chain owner can see and manage every location
-- from one place. Individual restaurant rows and restaurant_members rows are
-- unchanged — a user still only sees the specific locations where they hold
-- an active restaurant_members row; organization_id just lets us find the
-- *sibling* locations worth offering a switch to, and lets us name the chain
-- itself separately from any one location's own display name.

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references public.profiles,
  created_at timestamptz not null default now()
);

alter table public.restaurants add column if not exists organization_id uuid references public.organizations on delete set null;
create index if not exists restaurants_organization on public.restaurants(organization_id);

-- Backfill: every existing restaurant gets its own single-location
-- organization (named after the restaurant, owned by its owner/admin member
-- if one exists) so nothing changes for restaurants that never add a second
-- location, and so organization_id is never null for an active restaurant.
do $$
declare rec record; new_org_id uuid; chosen_owner uuid;
begin
  for rec in select id, name from public.restaurants where organization_id is null loop
    chosen_owner := null;
    select rm.user_id into chosen_owner from public.restaurant_members rm where rm.restaurant_id=rec.id and rm.role='owner' and rm.active limit 1;
    if chosen_owner is null then
      select rm.user_id into chosen_owner from public.restaurant_members rm where rm.restaurant_id=rec.id and rm.active order by rm.user_id limit 1;
    end if;
    if chosen_owner is not null then
      insert into public.organizations(name, owner_id) values (rec.name, chosen_owner) returning id into new_org_id;
      update public.restaurants set organization_id=new_org_id where id=rec.id;
    end if;
  end loop;
end $$;

alter table public.organizations enable row level security;

create or replace function public.is_org_member(oid uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(
    select 1 from public.restaurants r
    join public.restaurant_members rm on rm.restaurant_id=r.id
    where r.organization_id=oid and rm.user_id=auth.uid() and rm.active
  )
$$;

drop policy if exists "org members see organization" on public.organizations;
create policy "org members see organization" on public.organizations for select using (public.is_org_member(id));

create index if not exists organizations_owner on public.organizations(owner_id);
