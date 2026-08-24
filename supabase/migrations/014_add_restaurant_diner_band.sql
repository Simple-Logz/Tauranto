-- Keep restaurant onboarding schema aligned with the production database.
-- The onboarding API stores the user's approximate daily diner volume here.

alter table public.restaurants
  add column if not exists diner_band text;

alter table public.restaurants
  drop constraint if exists restaurants_diner_band_check;

alter table public.restaurants
  add constraint restaurants_diner_band_check
  check (
    diner_band is null
    or diner_band in ('0-100', '100-300', '300-500', '500-1000+')
  );
