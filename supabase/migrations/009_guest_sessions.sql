-- Tauranto Tables / Guest Sessions
create table if not exists dining_tables (
  id uuid primary key default gen_random_uuid(), restaurant_id uuid not null references restaurants(id) on delete cascade,
  name text not null, section text, capacity int not null default 2 check (capacity > 0), active boolean not null default true,
  created_at timestamptz not null default now(), unique(restaurant_id,name)
);
create table if not exists guest_sessions (
  id uuid primary key default gen_random_uuid(), restaurant_id uuid not null references restaurants(id) on delete cascade,
  table_id uuid references dining_tables(id) on delete set null, server_id uuid references auth.users(id) on delete set null,
  guest_name text, guest_phone text, party_size int not null default 1 check (party_size > 0),
  status text not null default 'seated' check(status in ('reserved','seated','ordering','preparing','ready','served','check_requested','payment','closed','cancelled')),
  source text not null default 'walk_in', external_reservation_id text, external_pos_check_id text,
  consent_to_messages boolean not null default false, opened_at timestamptz not null default now(), closed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists guest_session_events (
  id uuid primary key default gen_random_uuid(), restaurant_id uuid not null references restaurants(id) on delete cascade,
  session_id uuid not null references guest_sessions(id) on delete cascade, actor_id uuid references auth.users(id) on delete set null,
  event_type text not null, source text not null default 'app', summary text, payload jsonb not null default '{}'::jsonb,
  external_id text, created_at timestamptz not null default now()
);
create table if not exists guest_messages (
  id uuid primary key default gen_random_uuid(), restaurant_id uuid not null references restaurants(id) on delete cascade,
  session_id uuid not null references guest_sessions(id) on delete cascade, channel text not null check(channel in ('sms','email','push','web')),
  direction text not null default 'outbound' check(direction in ('outbound','inbound')), body text not null,
  status text not null default 'queued', provider_message_id text, created_at timestamptz not null default now(), sent_at timestamptz
);
create index if not exists idx_guest_sessions_restaurant_open on guest_sessions(restaurant_id,status,opened_at desc);
create index if not exists idx_guest_sessions_server on guest_sessions(server_id,opened_at desc);
create index if not exists idx_guest_events_session on guest_session_events(session_id,created_at desc);
create index if not exists idx_guest_sessions_closed on guest_sessions(restaurant_id,closed_at) where closed_at is not null;
alter table dining_tables enable row level security; alter table guest_sessions enable row level security; alter table guest_session_events enable row level security; alter table guest_messages enable row level security;
-- API uses the service role after verifying restaurant membership; direct client access remains blocked by RLS.
