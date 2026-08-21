-- Launch hardening: explicit tenant read policies, private helper execution, and hot-path indexes.
revoke execute on function public.is_member(uuid) from public, anon;
grant execute on function public.is_member(uuid) to authenticated, service_role;

drop policy if exists dining_tables_member_read on public.dining_tables;
create policy dining_tables_member_read on public.dining_tables for select to authenticated using (public.is_member(restaurant_id));
drop policy if exists guest_sessions_member_read on public.guest_sessions;
create policy guest_sessions_member_read on public.guest_sessions for select to authenticated using (public.is_member(restaurant_id));
drop policy if exists guest_session_events_member_read on public.guest_session_events;
create policy guest_session_events_member_read on public.guest_session_events for select to authenticated using (public.is_member(restaurant_id));
drop policy if exists guest_messages_member_read on public.guest_messages;
create policy guest_messages_member_read on public.guest_messages for select to authenticated using (public.is_member(restaurant_id));
drop policy if exists payment_settings_member_read on public.restaurant_payment_settings;
create policy payment_settings_member_read on public.restaurant_payment_settings for select to authenticated using (public.is_member(restaurant_id));
drop policy if exists execution_jobs_member_read on public.execution_jobs;
create policy execution_jobs_member_read on public.execution_jobs for select to authenticated using (
 exists(select 1 from public.commands c where c.id=execution_jobs.command_id and public.is_member(c.restaurant_id))
);

create index if not exists audit_events_actor_idx on public.audit_events(actor_id);
create index if not exists audit_events_command_idx on public.audit_events(command_id);
create index if not exists commands_created_by_idx on public.commands(created_by);
create index if not exists department_members_user_idx on public.department_members(user_id);
create index if not exists departments_created_by_idx on public.departments(created_by);
create index if not exists guest_messages_restaurant_idx on public.guest_messages(restaurant_id);
create index if not exists guest_messages_session_idx on public.guest_messages(session_id);
create index if not exists guest_session_events_actor_idx on public.guest_session_events(actor_id);
create index if not exists guest_session_events_restaurant_idx on public.guest_session_events(restaurant_id);
create index if not exists guest_sessions_table_idx on public.guest_sessions(table_id);
create index if not exists integrations_restaurant_idx on public.integrations(restaurant_id);
create index if not exists manager_invites_invited_by_idx on public.manager_invites(invited_by);
create index if not exists support_requests_requested_by_idx on public.support_requests(requested_by);
