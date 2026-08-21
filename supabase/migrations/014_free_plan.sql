insert into public.plans (
  id,
  name,
  monthly_price_cents,
  description,
  features,
  entitlements,
  active
) values (
  'free',
  'Free',
  0,
  'Essential voice operations for one restaurant workspace',
  '["Voice and typed commands","Recent activity","1 restaurant workspace","1 owner account"]'::jsonb,
  '{"voice_commands":true,"approvals":false,"activity":true,"website":false,"google_calendar":false,"gmail":false,"slack":false,"hubspot":false,"square":false,"toast":false,"multi_location":false,"advanced_audit":false}'::jsonb,
  true
)
on conflict (id) do update set
  name = excluded.name,
  monthly_price_cents = excluded.monthly_price_cents,
  description = excluded.description,
  features = excluded.features,
  entitlements = excluded.entitlements,
  active = excluded.active;
