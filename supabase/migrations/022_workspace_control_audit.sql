-- Track meaningful restaurant control changes made from Tauranto workspace screens.
create table if not exists public.workspace_control_events (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  area text not null,
  action text not null,
  changes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists workspace_control_events_restaurant_created_idx on public.workspace_control_events(restaurant_id,created_at desc);
alter table public.workspace_control_events enable row level security;
revoke all on public.workspace_control_events from anon,authenticated;
comment on table public.workspace_control_events is 'Server-written audit trail for settings, team, integrations, billing, automation and other workspace control changes.';