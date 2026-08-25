-- Complete every database field currently required by api/account/onboard.ts.
-- This prevents onboarding from failing one missing column at a time.

alter table public.restaurants add column if not exists public_code text;
alter table public.restaurants add column if not exists ownership_status text not null default 'pending';
alter table public.restaurants add column if not exists owner_claim_hash text;

create unique index if not exists restaurants_public_code_uidx
  on public.restaurants(public_code) where public_code is not null;
create index if not exists restaurants_owner_claim_hash_idx
  on public.restaurants(owner_claim_hash) where owner_claim_hash is not null;

alter table public.restaurant_members add column if not exists can_view_all_tables boolean not null default false;
alter table public.restaurant_members add column if not exists can_close_tables boolean not null default false;
alter table public.restaurant_members add column if not exists can_restore_history boolean not null default false;
alter table public.restaurant_members add column if not exists can_issue_checkout boolean not null default false;
