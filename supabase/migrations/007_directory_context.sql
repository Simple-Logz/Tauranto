alter table public.vendors add column if not exists contact_name text;
alter table public.vendors add column if not exists kind text not null default 'vendor';
alter table public.vendors add column if not exists preferred_method text not null default 'email';
alter table public.vendors drop constraint if exists vendors_kind_check;
alter table public.vendors add constraint vendors_kind_check check (kind in ('vendor','driver','service_provider','other'));
alter table public.vendors drop constraint if exists vendors_preferred_method_check;
alter table public.vendors add constraint vendors_preferred_method_check check (preferred_method in ('email','phone','sms'));
create index if not exists vendors_restaurant_kind on public.vendors(restaurant_id,kind,active);