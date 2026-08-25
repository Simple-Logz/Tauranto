alter table public.restaurant_members add column if not exists access_status text not null default 'active' check (access_status in ('active','suspended','revoked'));
alter table public.restaurant_members add column if not exists suspended_until timestamptz;
alter table public.restaurant_members add column if not exists access_reason text;
alter table public.restaurant_members add column if not exists access_changed_at timestamptz;
alter table public.restaurant_members add column if not exists access_changed_by uuid references auth.users(id) on delete set null;

update public.restaurant_members set access_status=case when active then 'active' else 'revoked' end where access_status is null or (active=false and access_status='active');

create index if not exists restaurant_members_access_status_idx on public.restaurant_members(restaurant_id,access_status);

create or replace function public.normalize_restaurant_member_access() returns trigger language plpgsql as $$
begin
  if new.access_status='active' then new.active=true; new.suspended_until=null;
  elsif new.access_status in ('suspended','revoked') then new.active=false;
  end if;
  return new;
end $$;
drop trigger if exists normalize_restaurant_member_access_trigger on public.restaurant_members;
create trigger normalize_restaurant_member_access_trigger before insert or update of access_status on public.restaurant_members for each row execute function public.normalize_restaurant_member_access();

create or replace function public.restore_expired_member_suspensions() returns integer language plpgsql security definer set search_path=public as $$
declare n integer;
begin
 update restaurant_members set access_status='active',active=true,suspended_until=null,access_reason=null,access_changed_at=now() where access_status='suspended' and suspended_until is not null and suspended_until<=now();
 get diagnostics n=row_count; return n;
end $$;