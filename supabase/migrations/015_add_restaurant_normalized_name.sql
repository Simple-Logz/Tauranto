-- Restaurant onboarding uses normalized_name for consistent restaurant identity matching.
alter table public.restaurants
  add column if not exists normalized_name text;

update public.restaurants
set normalized_name = lower(regexp_replace(trim(name), '\s+', ' ', 'g'))
where normalized_name is null;

create index if not exists restaurants_normalized_name_idx
  on public.restaurants (normalized_name);
