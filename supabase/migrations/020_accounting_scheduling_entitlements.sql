-- New integration categories (QuickBooks Online for accounting, Deputy for
-- staff scheduling) are Enterprise-tier connectors, same tier as the other
-- business-system integrations (Slack, HubSpot, Square, Toast).
update public.plans set entitlements = entitlements || '{"quickbooks":false,"deputy":false}'::jsonb where id='basic';
update public.plans set entitlements = entitlements || '{"quickbooks":true,"deputy":true}'::jsonb where id='enterprise';
update public.plans set features = features || '["QuickBooks accounting sync","Deputy staff scheduling"]'::jsonb where id='enterprise';
