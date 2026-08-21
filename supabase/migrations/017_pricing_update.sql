-- Corrected launch pricing. The 002_billing_plans.sql seed used placeholder
-- prices ($14.99 / $29.99); this updates them to the real pilot prices.
-- Plain updates (not inserts) so this is safe to re-run and does not touch
-- anything else about the plan rows.
update public.plans set monthly_price_cents = 3000 where id = 'basic';
update public.plans set monthly_price_cents = 6500 where id = 'enterprise';
