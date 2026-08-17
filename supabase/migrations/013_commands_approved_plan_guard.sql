-- Keep command creation compatible with the operations engine even when approval is pending.
alter table public.commands
  alter column approved_plan set default '[]'::jsonb;

update public.commands
set approved_plan = '[]'::jsonb
where approved_plan is null;

alter table public.commands
  alter column approved_plan set not null;
