alter table public.restaurant_members add column if not exists revoked_at timestamptz;
alter table public.restaurant_members add column if not exists restore_until timestamptz;

create index if not exists restaurant_members_restore_window_idx on public.restaurant_members(restaurant_id,restore_until) where access_status='revoked';

create or replace function public.revoke_auth_sessions(target_user uuid) returns void language plpgsql security definer set search_path=public,auth as $$
begin
 update auth.refresh_tokens set revoked=true,updated_at=now() where user_id=target_user and revoked=false;
 delete from auth.sessions where user_id=target_user;
end $$;
revoke all on function public.revoke_auth_sessions(uuid) from public,anon,authenticated;
grant execute on function public.revoke_auth_sessions(uuid) to service_role;

create or replace function public.revoke_restaurant_member(target_restaurant uuid,target_user uuid,actor_user uuid,reason_text text default null) returns timestamptz language plpgsql security definer set search_path=public,auth as $$
declare deadline timestamptz:=now()+interval '60 days';
begin
 update public.restaurant_members set access_status='revoked',active=false,revoked_at=now(),restore_until=deadline,suspended_until=null,access_reason=nullif(trim(reason_text),''),access_changed_at=now(),access_changed_by=actor_user where restaurant_id=target_restaurant and user_id=target_user and role<>'owner';
 if not found then raise exception 'MEMBER_NOT_REVOCABLE'; end if;
 perform public.revoke_auth_sessions(target_user);
 return deadline;
end $$;
revoke all on function public.revoke_restaurant_member(uuid,uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.revoke_restaurant_member(uuid,uuid,uuid,text) to service_role;

create or replace function public.suspend_restaurant_member(target_restaurant uuid,target_user uuid,actor_user uuid,reason_text text default null,until_time timestamptz default null) returns void language plpgsql security definer set search_path=public,auth as $$
begin
 update public.restaurant_members set access_status='suspended',active=false,suspended_until=until_time,revoked_at=null,restore_until=null,access_reason=nullif(trim(reason_text),''),access_changed_at=now(),access_changed_by=actor_user where restaurant_id=target_restaurant and user_id=target_user and role<>'owner';
 if not found then raise exception 'MEMBER_NOT_SUSPENDABLE'; end if;
 perform public.revoke_auth_sessions(target_user);
end $$;
revoke all on function public.suspend_restaurant_member(uuid,uuid,uuid,text,timestamptz) from public,anon,authenticated;
grant execute on function public.suspend_restaurant_member(uuid,uuid,uuid,text,timestamptz) to service_role;

create or replace function public.restore_restaurant_member(target_restaurant uuid,target_user uuid,actor_user uuid) returns void language plpgsql security definer set search_path=public as $$
declare m public.restaurant_members%rowtype;
begin
 select * into m from public.restaurant_members where restaurant_id=target_restaurant and user_id=target_user for update;
 if not found then raise exception 'MEMBER_NOT_FOUND'; end if;
 if m.access_status='revoked' and (m.restore_until is null or m.restore_until<now()) then raise exception 'RESTORE_WINDOW_EXPIRED'; end if;
 update public.restaurant_members set access_status='active',active=true,suspended_until=null,revoked_at=null,restore_until=null,access_reason=null,access_changed_at=now(),access_changed_by=actor_user where restaurant_id=target_restaurant and user_id=target_user;
end $$;
revoke all on function public.restore_restaurant_member(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.restore_restaurant_member(uuid,uuid,uuid) to service_role;