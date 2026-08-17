create extension if not exists pgcrypto;

do $$ begin alter type public.member_role add value if not exists 'server'; exception when duplicate_object then null; end $$;

alter table public.restaurants add column if not exists normalized_name text;
alter table public.restaurants add column if not exists public_code text;
alter table public.restaurants add column if not exists diner_band text;
alter table public.restaurants add column if not exists ownership_status text not null default 'pending';
alter table public.restaurants add column if not exists owner_claim_hash text;
alter table public.restaurants add column if not exists verified_at timestamptz;

update public.restaurants set normalized_name=lower(regexp_replace(trim(name),'\s+',' ','g')) where normalized_name is null;
create unique index if not exists restaurants_normalized_name_unique on public.restaurants(normalized_name) where normalized_name is not null;
create unique index if not exists restaurants_public_code_unique on public.restaurants(public_code) where public_code is not null;

alter table public.restaurant_members add column if not exists can_view_all_tables boolean not null default false;
alter table public.restaurant_members add column if not exists can_close_tables boolean not null default false;
alter table public.restaurant_members add column if not exists can_restore_history boolean not null default false;
alter table public.restaurant_members add column if not exists can_issue_checkout boolean not null default false;

create table if not exists public.staff_invites (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants on delete cascade,
  email text not null,
  role public.member_role not null default 'server',
  token_hash text not null,
  invited_by uuid not null references public.profiles,
  expires_at timestamptz not null default (now()+interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists staff_invites_restaurant_email on public.staff_invites(restaurant_id,lower(email));
