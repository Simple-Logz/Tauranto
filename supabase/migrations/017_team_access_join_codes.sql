alter table public.restaurants add column if not exists staff_join_code text;
alter table public.restaurants add column if not exists viewer_join_code text;
alter table public.restaurants add column if not exists staff_join_enabled boolean not null default true;
alter table public.restaurants add column if not exists viewer_join_enabled boolean not null default true;
create unique index if not exists restaurants_staff_join_code_uidx on public.restaurants(staff_join_code) where staff_join_code is not null;
create unique index if not exists restaurants_viewer_join_code_uidx on public.restaurants(viewer_join_code) where viewer_join_code is not null;
update public.restaurants set staff_join_code='TS-'||upper(substr(md5(id::text||'staff'),1,8)) where staff_join_code is null;
update public.restaurants set viewer_join_code='TV-'||upper(substr(md5(id::text||'viewer'),1,8)) where viewer_join_code is null;