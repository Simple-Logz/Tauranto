-- Per-user rate limiting for the endpoints that call OpenAI (transcription
-- and command interpretation). Only the server (service-role key) ever
-- touches this table, so RLS is enabled with no policies defined — that
-- denies every request from the anon/authenticated roles by default and
-- relies on the service role bypassing RLS entirely, matching how the rest
-- of this app's write path already works.
create table if not exists public.rate_limits (
  key text primary key,
  count int not null default 0,
  window_start timestamptz not null default now()
);
alter table public.rate_limits enable row level security;

-- Atomically increments the counter for `p_key`, resetting it if the
-- current window has expired, and returns whether the caller is still
-- within `p_limit` for this window. Using a single upsert with `for update`
-- semantics (via the unique key) avoids the read-then-write race that a
-- select-then-update pattern from application code would have under
-- concurrent requests from the same user.
create or replace function public.check_rate_limit(p_key text, p_window_seconds int, p_limit int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count int;
  window_started timestamptz;
begin
  insert into public.rate_limits(key, count, window_start)
  values (p_key, 1, now())
  on conflict (key) do update set
    count = case
      when public.rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
        then 1
      else public.rate_limits.count + 1
    end,
    window_start = case
      when public.rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
        then now()
      else public.rate_limits.window_start
    end
  returning count, window_start into current_count, window_started;

  return current_count <= p_limit;
end;
$$;

create index if not exists rate_limits_window_start on public.rate_limits(window_start);
