create table if not exists public.integration_catalog (
  key text primary key,
  name text not null,
  category text not null,
  description text not null default '',
  connect_mode text not null default 'request' check (connect_mode in ('live','request')),
  sort_order integer not null default 100
);
create table if not exists public.integration_requests (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  catalog_key text not null references public.integration_catalog(key) on delete cascade,
  requested_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(restaurant_id,catalog_key)
);
create index if not exists integration_catalog_category_idx on public.integration_catalog(category,sort_order);
create index if not exists integration_requests_restaurant_idx on public.integration_requests(restaurant_id);
alter table public.integration_catalog enable row level security;
alter table public.integration_requests enable row level security;

do $$ begin
 create policy "catalog authenticated read" on public.integration_catalog for select to authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
 create policy "members read integration requests" on public.integration_requests for select to authenticated using (exists(select 1 from public.restaurant_members rm where rm.restaurant_id=integration_requests.restaurant_id and rm.user_id=auth.uid() and rm.active=true));
exception when duplicate_object then null; end $$;
do $$ begin
 create policy "members create integration requests" on public.integration_requests for insert to authenticated with check (exists(select 1 from public.restaurant_members rm where rm.restaurant_id=integration_requests.restaurant_id and rm.user_id=auth.uid() and rm.active=true));
exception when duplicate_object then null; end $$;

insert into public.integration_catalog(key,name,category,description,connect_mode,sort_order) values
('toast','Toast','pos','POS, menu, orders and restaurant operations.','live',10),
('square','Square','pos','Payments, POS, orders and restaurant commerce.','request',11),
('clover','Clover','pos','Restaurant POS, payments and order management.','request',12),
('lightspeed','Lightspeed Restaurant','pos','Restaurant POS, payments, menus and reporting.','request',13),
('spoton','SpotOn','pos','Restaurant POS, payments and guest management.','request',14),
('touchbistro','TouchBistro','pos','Restaurant POS and front-of-house operations.','request',15),
('revel','Revel Systems','pos','Cloud POS and restaurant operations.','request',16),
('oracle_micros','Oracle MICROS','pos','Enterprise restaurant POS and operations.','request',17),
('doordash','DoorDash','delivery','Delivery, marketplace orders and store operations.','request',30),
('uber_eats','Uber Eats','delivery','Marketplace orders, menus and store availability.','request',31),
('grubhub','Grubhub','delivery','Restaurant marketplace orders, menus and delivery.','request',32),
('chowly','Chowly','delivery','Aggregate online orders into restaurant POS workflows.','request',33),
('olo','Olo','delivery','Digital ordering, delivery and restaurant commerce.','request',34),
('ezcater','ezCater','delivery','Catering marketplace and restaurant catering orders.','request',35),
('opentable','OpenTable','reservations','Reservations, guests and table management.','request',50),
('resy','Resy','reservations','Reservations, waitlists and guest management.','request',51),
('yelp_guest_manager','Yelp Guest Manager','reservations','Reservations, waitlist and front-of-house guest tools.','request',52),
('sevenrooms','SevenRooms','reservations','Reservations, guest profiles and restaurant CRM.','request',53),
('when_i_work','When I Work','scheduling','Employee scheduling, time tracking and team messaging.','request',70),
('7shifts','7shifts','scheduling','Restaurant scheduling, labor and team management.','request',71),
('homebase','Homebase','scheduling','Scheduling, time clocks, payroll and team management.','request',72),
('deputy','Deputy','scheduling','Employee scheduling, time tracking and workforce management.','request',73),
('hotschedules','HotSchedules','scheduling','Restaurant staff scheduling and workforce management.','request',74),
('adp','ADP','payroll','Payroll, HR and workforce data.','request',90),
('gusto','Gusto','payroll','Payroll, benefits and HR.','request',91),
('paychex','Paychex','payroll','Payroll and HR services.','request',92),
('quickbooks','QuickBooks Online','accounting','Accounting, expenses, invoices and financial reporting.','request',110),
('xero','Xero','accounting','Cloud accounting and financial data.','request',111),
('restaurant365','Restaurant365','accounting','Restaurant accounting, operations and workforce management.','request',112),
('marketman','MarketMan','inventory','Restaurant inventory, purchasing and food-cost management.','request',130),
('marginedge','MarginEdge','inventory','Invoice processing, food costs and restaurant operations.','request',131),
('xtrachef','xtraCHEF','inventory','Restaurant invoice automation, inventory and food-cost tools.','request',132),
('sysco','Sysco','suppliers','Foodservice purchasing and supplier workflows.','request',150),
('us_foods','US Foods','suppliers','Foodservice ordering and supplier workflows.','request',151),
('performance_foodservice','Performance Foodservice','suppliers','Restaurant foodservice purchasing and supply.','request',152),
('gmail','Gmail','communication','Restaurant email and operational communication.','request',170),
('outlook','Microsoft Outlook','communication','Email and calendar communication for restaurant teams.','request',171),
('slack','Slack','communication','Team messaging, channels and operational alerts.','request',172),
('microsoft_teams','Microsoft Teams','communication','Team chat, calls, meetings and collaboration.','request',173),
('google_calendar','Google Calendar','calendar','Restaurant events, schedules and calendar operations.','live',190),
('outlook_calendar','Outlook Calendar','calendar','Microsoft calendar events and scheduling.','request',191),
('apple_calendar','Apple Calendar','calendar','Calendar scheduling for Apple-based restaurant teams.','request',192),
('zoom','Zoom','meetings','Video meetings and team collaboration.','live',210),
('google_meet','Google Meet','meetings','Video meetings through Google Workspace.','request',211),
('teams_meetings','Microsoft Teams Meetings','meetings','Microsoft Teams video meetings and calendars.','request',212),
('hubspot','HubSpot','marketing','CRM, contacts, marketing and customer communications.','request',230),
('mailchimp','Mailchimp','marketing','Guest email marketing and campaigns.','request',231),
('constant_contact','Constant Contact','marketing','Email marketing and customer campaigns.','request',232),
('google_business','Google Business Profile','presence','Restaurant profile, presence and customer-facing business information.','request',250),
('yelp','Yelp for Business','presence','Restaurant presence and customer reviews.','request',251),
('tripadvisor','Tripadvisor','presence','Restaurant listing, reputation and traveler reviews.','request',252),
('google_drive','Google Drive','files','Restaurant files, documents and shared operational content.','request',270),
('dropbox','Dropbox','files','Shared restaurant files and documents.','request',271),
('onedrive','Microsoft OneDrive','files','Microsoft cloud files and restaurant documents.','request',272),
('maintainx','MaintainX','maintenance','Equipment maintenance, work orders and operational checklists.','request',290),
('upkeep','UpKeep','maintenance','Restaurant asset maintenance and work orders.','request',291),
('website','Restaurant Website','website','Connect the restaurant website to Tauranto workflows.','live',310)
on conflict(key) do update set name=excluded.name,category=excluded.category,description=excluded.description,connect_mode=excluded.connect_mode,sort_order=excluded.sort_order;
