alter table public.profiles add column if not exists avatar_url text;
alter table public.restaurants add column if not exists logo_url text;
alter table public.restaurants add column if not exists phone text;
alter table public.restaurants add column if not exists website text;
alter table public.restaurants add column if not exists address text;

create table if not exists public.restaurant_preferences (
  restaurant_id uuid primary key references public.restaurants on delete cascade,
  notifications jsonb not null default '{"approval_email":true,"command_failures":true,"weekly_summary":true}',
  voice jsonb not null default '{"standby":true,"spoken_confirmations":true,"language":"en-US"}',
  privacy jsonb not null default '{"retain_audio":false,"activity_retention_days":90}',
  updated_at timestamptz not null default now()
);
alter table public.restaurant_preferences enable row level security;

drop policy if exists "members see preferences" on public.restaurant_preferences;
create policy "members see preferences" on public.restaurant_preferences for select using(public.is_member(restaurant_id));
drop policy if exists "owners manage preferences" on public.restaurant_preferences;
create policy "owners manage preferences" on public.restaurant_preferences for all using(exists(select 1 from public.restaurant_members m where m.restaurant_id=restaurant_preferences.restaurant_id and m.user_id=auth.uid() and m.active and m.role in ('owner','admin'))) with check(exists(select 1 from public.restaurant_members m where m.restaurant_id=restaurant_preferences.restaurant_id and m.user_id=auth.uid() and m.active and m.role in ('owner','admin')));

drop policy if exists "user updates profile" on public.profiles;
create policy "user updates profile" on public.profiles for update using(id=auth.uid()) with check(id=auth.uid());
drop policy if exists "owners update restaurant" on public.restaurants;
create policy "owners update restaurant" on public.restaurants for update using(exists(select 1 from public.restaurant_members m where m.restaurant_id=restaurants.id and m.user_id=auth.uid() and m.active and m.role in ('owner','admin')));
drop policy if exists "owners manage members" on public.restaurant_members;
create policy "owners manage members" on public.restaurant_members for update using(exists(select 1 from public.restaurant_members me where me.restaurant_id=restaurant_members.restaurant_id and me.user_id=auth.uid() and me.active and me.role in ('owner','admin')));
