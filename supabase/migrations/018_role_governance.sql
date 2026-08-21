-- Role-based governance: how high a risk each member role may trigger
-- without an automatic escalation to approval, and an optional per-role
-- spend limit for purchase-type commands. Both are restaurant-configurable
-- (see api/account/policy.ts + the Settings "Automation & approvals" /
-- "Role authority" / "Spending limits by role" sections) and fall back to
-- sane defaults in code (src/lib/governance.ts DEFAULT_ROLE_MAX_RISK) when a
-- restaurant hasn't set its own values yet.
alter table public.operation_policies add column if not exists role_max_risk jsonb not null default '{"owner":"critical","admin":"critical","manager":"high","operator":"medium","server":"low","viewer":"low"}';
alter table public.operation_policies add column if not exists role_spend_limits jsonb not null default '{}';

-- Migration 005 only ever granted select on operation_policies. The API
-- writes through the service role (which bypasses RLS) and checks
-- owner/admin in code, but this policy is added for defense in depth and to
-- match the pattern already used for restaurant_preferences/restaurants.
drop policy if exists "owners manage operation policies" on public.operation_policies;
create policy "owners manage operation policies" on public.operation_policies for all
  using (exists (select 1 from public.restaurant_members m where m.restaurant_id = operation_policies.restaurant_id and m.user_id = auth.uid() and m.active and m.role in ('owner','admin')))
  with check (exists (select 1 from public.restaurant_members m where m.restaurant_id = operation_policies.restaurant_id and m.user_id = auth.uid() and m.active and m.role in ('owner','admin')));
