-- One Tauranto instruction can legitimately fan out to several providers
-- (for example Calendar + Zoom, or website + POS). command_id therefore
-- cannot be unique on execution_jobs.
alter table public.execution_jobs
  drop constraint if exists execution_jobs_command_id_key;

create index if not exists execution_jobs_command_id_idx
  on public.execution_jobs(command_id);
