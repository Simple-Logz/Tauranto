alter table public.commands add column if not exists intent text;
alter table public.commands add column if not exists resolved_context jsonb not null default '{}';
alter table public.commands add column if not exists impact_plan jsonb not null default '[]';
alter table public.commands add column if not exists validation jsonb not null default '{}';
alter table public.commands add column if not exists approved_plan jsonb not null default '[]';
alter table public.commands add column if not exists verified_at timestamptz;

alter table public.execution_jobs add column if not exists provider text;
alter table public.execution_jobs add column if not exists action_key text;
alter table public.execution_jobs add column if not exists payload jsonb not null default '{}';
alter table public.execution_jobs add column if not exists verification jsonb not null default '{}';
alter table public.execution_jobs add column if not exists next_attempt_at timestamptz;

create table if not exists public.operation_policies (
 restaurant_id uuid primary key references public.restaurants on delete cascade,
 auto_execute_low_risk boolean not null default false,
 medium_approvals int not null default 1,
 high_approvals int not null default 1,
 critical_approvals int not null default 2,
 allowed_intents text[] not null default array['menu_availability','business_hours','pause_orders','announcement','internal_task'],
 updated_at timestamptz not null default now()
);
alter table public.operation_policies enable row level security;
drop policy if exists "members see operation policies" on public.operation_policies;
create policy "members see operation policies" on public.operation_policies for select using(public.is_member(restaurant_id));

create table if not exists public.operation_events (
 id bigint generated always as identity primary key,
 restaurant_id uuid not null references public.restaurants on delete cascade,
 command_id uuid references public.commands on delete cascade,
 job_id uuid references public.execution_jobs on delete set null,
 stage text not null,
 status text not null,
 detail jsonb not null default '{}',
 created_at timestamptz not null default now()
);
alter table public.operation_events enable row level security;
drop policy if exists "members see operation events" on public.operation_events;
create policy "members see operation events" on public.operation_events for select using(public.is_member(restaurant_id));
create index if not exists operation_events_command_created on public.operation_events(command_id,created_at);
create index if not exists execution_jobs_retry on public.execution_jobs(status,next_attempt_at);
