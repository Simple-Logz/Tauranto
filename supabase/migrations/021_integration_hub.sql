-- Integration Hub: a real, database-backed catalog of every platform Tauranto
-- can plausibly connect to, so "browse and search everything we might want to
-- connect" isn't a hardcoded list baked into the app bundle. A handful of
-- entries already have a live, working connection path (they mirror the
-- provider keys api/integrations/oauth-start.ts already knows how to
-- authorize); the rest are real, trackable demand signals — a restaurant
-- tapping "Request" writes a genuine row here, so which integrations to build
-- next becomes a question the data can answer instead of a guess.

do $$ begin create type public.integration_connect_mode as enum ('live','request'); exception when duplicate_object then null; end $$;

create table if not exists public.integration_catalog (
  key text primary key,
  name text not null,
  category text not null,
  description text not null,
  connect_mode public.integration_connect_mode not null default 'request',
  sort_order int not null default 100,
  created_at timestamptz not null default now()
);

alter table public.integration_catalog enable row level security;
drop policy if exists "authenticated read catalog" on public.integration_catalog;
create policy "authenticated read catalog" on public.integration_catalog for select using (auth.role() = 'authenticated');

-- One row per restaurant per catalog entry a chain has asked for — unique so
-- tapping "Request" twice is a no-op, not duplicate demand.
create table if not exists public.integration_requests (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants on delete cascade,
  catalog_key text not null references public.integration_catalog(key) on delete cascade,
  requested_by uuid references public.profiles,
  created_at timestamptz not null default now(),
  unique(restaurant_id, catalog_key)
);

alter table public.integration_requests enable row level security;
drop policy if exists "members see their requests" on public.integration_requests;
create policy "members see their requests" on public.integration_requests for select using (public.is_member(restaurant_id));
drop policy if exists "members create requests" on public.integration_requests;
create policy "members create requests" on public.integration_requests for insert with check (public.is_member(restaurant_id));

create index if not exists integration_requests_restaurant on public.integration_requests(restaurant_id);
create index if not exists integration_catalog_category on public.integration_catalog(category);

insert into public.integration_catalog (key,name,category,description,connect_mode,sort_order) values
 ('toast','Toast','pos','Restaurant POS — sales, menu availability, orders, item and table status.','live',10),
 ('square','Square','pos','POS and payments — sales, items, orders.','live',20),
 ('clover','Clover','pos','POS platform used by many independent restaurants.','request',30),
 ('lightspeed','Lightspeed','pos','Retail and restaurant POS.','request',40),
 ('doordash','DoorDash','delivery','Pause ordering, availability, and order monitoring.','request',50),
 ('ubereats','Uber Eats','delivery','Pause ordering, availability, and order monitoring.','request',60),
 ('grubhub','Grubhub','delivery','Pause ordering, availability, and order monitoring.','request',70),
 ('opentable','OpenTable','reservations','Reservations, cancellations, guest counts, table information.','request',80),
 ('resy','Resy','reservations','Reservations, cancellations, guest counts, table information.','request',90),
 ('sevenrooms','SevenRooms','reservations','Reservations, cancellations, guest counts, table information.','request',100),
 ('deputy','Deputy','scheduling','Staff scheduling and time tracking.','live',110),
 ('sevenshifts','7shifts','scheduling','Schedules, call-outs, replacements, shift changes.','request',120),
 ('homebase','Homebase','scheduling','Schedules, call-outs, replacements, shift changes.','request',130),
 ('wheniwork','When I Work','scheduling','Schedules, call-outs, replacements, shift changes.','request',140),
 ('adp','ADP','payroll','Hours, payroll reminders, employee information.','request',150),
 ('gusto','Gusto','payroll','Hours, payroll reminders, employee information.','request',160),
 ('paychex','Paychex','payroll','Hours, payroll reminders, employee information.','request',170),
 ('square_payroll','Square Payroll','payroll','Hours, payroll reminders, employee information.','request',180),
 ('quickbooks','QuickBooks Online','accounting','Accounting and bookkeeping — sales/revenue summaries, expenses, financial reports.','live',190),
 ('xero','Xero','accounting','Sales/revenue summaries, expenses, financial reports.','request',200),
 ('restaurant365','Restaurant365','accounting','Accounting, inventory and purchasing built for restaurants.','request',210),
 ('marketman','MarketMan','inventory','Stock, shortages, invoices, food costs, purchasing.','request',220),
 ('xtrachef','xtraCHEF','inventory','Stock, shortages, invoices, food costs, purchasing.','request',230),
 ('sysco','Sysco','suppliers','Purchasing, delivery and order information where the supplier''s API permits.','request',240),
 ('usfoods','US Foods','suppliers','Purchasing, delivery and order information where the supplier''s API permits.','request',250),
 ('performance_foodservice','Performance Foodservice','suppliers','Purchasing, delivery and order information where the supplier''s API permits.','request',260),
 ('gmail','Gmail','communication','Supplier and business email.','live',270),
 ('slack','Slack','communication','Team communication — staff and management messages and notifications.','live',280),
 ('msteams','Microsoft Teams','communication','Staff and management messages, meetings and notifications.','request',290),
 ('outlook','Outlook','communication','Supplier and business email.','request',300),
 ('google_calendar','Google Calendar','calendar','Calendar and Google Meet — meetings, events, deliveries, reminders.','live',310),
 ('outlook_calendar','Microsoft Outlook Calendar','calendar','Meetings, events, deliveries, reminders.','request',320),
 ('zoom','Zoom','meetings','Video meetings and manager communications.','live',330),
 ('hubspot','HubSpot','marketing','CRM — campaigns and customer communication.','live',340),
 ('mailchimp','Mailchimp','marketing','Campaigns and customer communication.','request',350),
 ('constant_contact','Constant Contact','marketing','Campaigns and customer communication.','request',360),
 ('google_business','Google Business Profile','presence','Reviews, business information, reputation alerts.','request',370),
 ('yelp','Yelp','presence','Reviews, business information, reputation alerts.','request',380),
 ('google_drive','Google Drive','files','SOPs, invoices, menus, training docs.','request',390),
 ('onedrive','OneDrive','files','SOPs, invoices, menus, training docs.','request',400),
 ('dropbox','Dropbox','files','SOPs, invoices, menus, training docs.','request',410),
 ('maintainx','MaintainX','maintenance','Equipment problems and maintenance work orders.','request',420),
 ('upkeep','UpKeep','maintenance','Equipment problems and maintenance work orders.','request',430),
 ('website','Website','website','Menu, hours and website actions.','live',440)
on conflict (key) do update set name=excluded.name,category=excluded.category,description=excluded.description,connect_mode=excluded.connect_mode,sort_order=excluded.sort_order;
