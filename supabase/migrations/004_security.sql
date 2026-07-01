-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- Security hardening
-- Run this in Supabase SQL Editor after migrations 001â€“003
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•


-- â”€â”€ 1. Fix seed_demo_data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
--
-- Previous version had two problems:
--   a) No caller check â€” any authenticated user could seed data into ANY account
--   b) No SET search_path â€” SECURITY DEFINER functions are vulnerable to
--      search_path injection if an attacker creates a schema with same-named objects

create or replace function seed_demo_data(p_landlord_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  prop1_id uuid := gen_random_uuid();
  prop2_id uuid := gen_random_uuid();
  prop3_id uuid := gen_random_uuid();
  tenant1_id uuid := gen_random_uuid();
  tenant2_id uuid := gen_random_uuid();
  tenant3_id uuid := gen_random_uuid();
  room1_id uuid := gen_random_uuid();
  room2_id uuid := gen_random_uuid();
  room3_id uuid := gen_random_uuid();
  room4_id uuid := gen_random_uuid();
  room5_id uuid := gen_random_uuid();
  room6_id uuid := gen_random_uuid();
  room7_id uuid := gen_random_uuid();
  room8_id uuid := gen_random_uuid();
  room9_id uuid := gen_random_uuid();
  room10_id uuid := gen_random_uuid();
  room11_id uuid := gen_random_uuid();
  room12_id uuid := gen_random_uuid();
  room13_id uuid := gen_random_uuid();
  room14_id uuid := gen_random_uuid();
begin
  -- Caller may only seed their own account
  if auth.uid() != p_landlord_id then
    raise exception 'Forbidden: you may only seed your own account';
  end if;

  -- Properties
  insert into properties (id, landlord_id, name, address, city, postal_code) values
    (prop1_id, p_landlord_id, 'Calle AlcalÃ¡ 45',     'Calle AlcalÃ¡ 45',     'Madrid', '28014'),
    (prop2_id, p_landlord_id, 'Gran VÃ­a 120',         'Gran VÃ­a 120',         'Madrid', '28013'),
    (prop3_id, p_landlord_id, 'Calle Fuencarral 8',  'Calle Fuencarral 8',  'Madrid', '28004');

  -- Rooms â€” property 1 (5 rooms)
  insert into rooms (id, property_id, number, monthly_rent, deposit_amount, size_sqm, amenities, status) values
    (room1_id,  prop1_id, '1', 550, 1100, 12.5, ARRAY['wifi','desk','wardrobe'],          'occupied'),
    (room2_id,  prop1_id, '2', 600, 1200, 14.0, ARRAY['wifi','desk','wardrobe','balcony'],'occupied'),
    (room3_id,  prop1_id, '3', 500, 1000, 11.0, ARRAY['wifi','desk'],                     'vacant'),
    (room4_id,  prop1_id, '4', 575, 1150, 13.0, ARRAY['wifi','desk','wardrobe'],          'occupied'),
    (room5_id,  prop1_id, '5', 525, 1050, 11.5, ARRAY['wifi','desk'],                     'maintenance');

  -- Rooms â€” property 2 (5 rooms)
  insert into rooms (id, property_id, number, monthly_rent, deposit_amount, size_sqm, amenities, status) values
    (room6_id,  prop2_id, '1', 650, 1300, 15.0, ARRAY['wifi','desk','wardrobe','ensuite'],'occupied'),
    (room7_id,  prop2_id, '2', 620, 1240, 14.0, ARRAY['wifi','desk','wardrobe'],          'occupied'),
    (room8_id,  prop2_id, '3', 580, 1160, 12.5, ARRAY['wifi','desk'],                     'occupied'),
    (room9_id,  prop2_id, '4', 600, 1200, 13.5, ARRAY['wifi','desk','wardrobe'],          'reserved'),
    (room10_id, prop2_id, '5', 570, 1140, 12.0, ARRAY['wifi','desk'],                     'occupied');

  -- Rooms â€” property 3 (4 rooms)
  insert into rooms (id, property_id, number, monthly_rent, deposit_amount, size_sqm, amenities, status) values
    (room11_id, prop3_id, '1', 480,  960, 10.5, ARRAY['wifi','desk'],          'occupied'),
    (room12_id, prop3_id, '2', 500, 1000, 11.0, ARRAY['wifi','desk','wardrobe'],'occupied'),
    (room13_id, prop3_id, '3', 460,  920, 10.0, ARRAY['wifi'],                  'vacant'),
    (room14_id, prop3_id, '4', 490,  980, 10.5, ARRAY['wifi','desk'],           'occupied');

  -- Tenants
  insert into tenants (id, landlord_id, room_id, full_name, email, phone, nationality, move_in_date, is_active) values
    (tenant1_id, p_landlord_id, room1_id, 'Carlos GarcÃ­a LÃ³pez', 'carlos.garcia@email.com', '+34 612 345 678', 'EspaÃ±ola',  '2025-09-01', true),
    (tenant2_id, p_landlord_id, room2_id, 'Sophie Martin',       'sophie.martin@email.com', '+34 623 456 789', 'Francesa',  '2025-10-15', true),
    (tenant3_id, p_landlord_id, room4_id, 'Ahmed Hassan',        'ahmed.hassan@email.com',  '+34 634 567 890', 'MarroquÃ­',  '2026-01-01', true);

  -- Payments (current month)
  insert into payments (tenant_id, room_id, amount, due_date, paid_date, status) values
    (tenant1_id, room1_id, 550, '2026-06-05', '2026-06-02', 'paid'),
    (tenant2_id, room2_id, 600, '2026-06-05', null,         'pending'),
    (tenant3_id, room4_id, 575, '2026-06-05', null,         'overdue');

  -- Maintenance issues
  insert into maintenance_issues (property_id, room_id, tenant_id, title, description, category, priority, status) values
    (prop1_id, room5_id,  null,      'CalefacciÃ³n no funciona',  'El radiador de la habitaciÃ³n 5 no calienta.', 'heating',     'urgent', 'open'),
    (prop1_id, room2_id,  tenant2_id,'Grifo con goteo',          'El grifo del baÃ±o tiene una pequeÃ±a fuga.',   'plumbing',    'medium', 'in_progress'),
    (prop2_id, room6_id,  null,      'Bombilla fundida',         'La bombilla del pasillo estÃ¡ fundida.',        'electricity', 'low',    'open'),
    (prop3_id, null,      null,      'RevisiÃ³n internet',        'La conexiÃ³n va lenta en las habitaciones 1 y 2.','internet',  'medium', 'open');
end;
$$;


-- â”€â”€ 2. updated_at triggers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
--
-- Prevent clients from spoofing the updated_at timestamp.
-- The trigger fires on every UPDATE and overwrites whatever the client sent.

create or replace function set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply to maintenance_issues
drop trigger if exists trg_maintenance_issues_updated_at on maintenance_issues;
create trigger trg_maintenance_issues_updated_at
  before update on maintenance_issues
  for each row execute function set_updated_at();

-- Apply to contracts
drop trigger if exists trg_contracts_updated_at on contracts;
create trigger trg_contracts_updated_at
  before update on contracts
  for each row execute function set_updated_at();

-- Apply to contract_templates
drop trigger if exists trg_contract_templates_updated_at on contract_templates;
create trigger trg_contract_templates_updated_at
  before update on contract_templates
  for each row execute function set_updated_at();


-- â”€â”€ 3. Explicit RLS policies with WITH CHECK â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
--
-- Replace the implicit FOR ALL policies with separate SELECT / INSERT /
-- UPDATE / DELETE policies.  The FOR ALL pattern works correctly in
-- Postgres, but being explicit makes the intent auditable and prevents
-- subtle mistakes during future policy changes.

-- properties
drop policy if exists "landlords_own_properties" on properties;

create policy "properties_select" on properties
  for select using (auth.uid() = landlord_id);

create policy "properties_insert" on properties
  for insert with check (auth.uid() = landlord_id);

create policy "properties_update" on properties
  for update using (auth.uid() = landlord_id)
  with check (auth.uid() = landlord_id);

create policy "properties_delete" on properties
  for delete using (auth.uid() = landlord_id);

-- rooms (ownership via parent property)
drop policy if exists "landlords_own_rooms" on rooms;

create policy "rooms_select" on rooms
  for select using (
    exists (select 1 from properties p where p.id = rooms.property_id and p.landlord_id = auth.uid())
  );

create policy "rooms_insert" on rooms
  for insert with check (
    exists (select 1 from properties p where p.id = rooms.property_id and p.landlord_id = auth.uid())
  );

create policy "rooms_update" on rooms
  for update
  using  (exists (select 1 from properties p where p.id = rooms.property_id and p.landlord_id = auth.uid()))
  with check (exists (select 1 from properties p where p.id = rooms.property_id and p.landlord_id = auth.uid()));

create policy "rooms_delete" on rooms
  for delete using (
    exists (select 1 from properties p where p.id = rooms.property_id and p.landlord_id = auth.uid())
  );

-- tenants
drop policy if exists "landlords_own_tenants" on tenants;

create policy "tenants_select" on tenants
  for select using (auth.uid() = landlord_id);

create policy "tenants_insert" on tenants
  for insert with check (auth.uid() = landlord_id);

create policy "tenants_update" on tenants
  for update using (auth.uid() = landlord_id)
  with check (auth.uid() = landlord_id);

create policy "tenants_delete" on tenants
  for delete using (auth.uid() = landlord_id);

-- payments
drop policy if exists "landlords_own_payments" on payments;

create policy "payments_select" on payments
  for select using (
    exists (select 1 from tenants t where t.id = payments.tenant_id and t.landlord_id = auth.uid())
  );

create policy "payments_insert" on payments
  for insert with check (
    exists (select 1 from tenants t where t.id = payments.tenant_id and t.landlord_id = auth.uid())
  );

create policy "payments_update" on payments
  for update
  using  (exists (select 1 from tenants t where t.id = payments.tenant_id and t.landlord_id = auth.uid()))
  with check (exists (select 1 from tenants t where t.id = payments.tenant_id and t.landlord_id = auth.uid()));

create policy "payments_delete" on payments
  for delete using (
    exists (select 1 from tenants t where t.id = payments.tenant_id and t.landlord_id = auth.uid())
  );

-- maintenance_issues
drop policy if exists "landlords_own_issues" on maintenance_issues;

create policy "issues_select" on maintenance_issues
  for select using (
    exists (select 1 from properties p where p.id = maintenance_issues.property_id and p.landlord_id = auth.uid())
  );

create policy "issues_insert" on maintenance_issues
  for insert with check (
    exists (select 1 from properties p where p.id = maintenance_issues.property_id and p.landlord_id = auth.uid())
  );

create policy "issues_update" on maintenance_issues
  for update
  using  (exists (select 1 from properties p where p.id = maintenance_issues.property_id and p.landlord_id = auth.uid()))
  with check (exists (select 1 from properties p where p.id = maintenance_issues.property_id and p.landlord_id = auth.uid()));

create policy "issues_delete" on maintenance_issues
  for delete using (
    exists (select 1 from properties p where p.id = maintenance_issues.property_id and p.landlord_id = auth.uid())
  );

-- contract_templates
drop policy if exists "landlords_own_templates" on contract_templates;

create policy "templates_select" on contract_templates
  for select using (auth.uid() = landlord_id);

create policy "templates_insert" on contract_templates
  for insert with check (auth.uid() = landlord_id);

create policy "templates_update" on contract_templates
  for update using (auth.uid() = landlord_id)
  with check (auth.uid() = landlord_id);

create policy "templates_delete" on contract_templates
  for delete using (auth.uid() = landlord_id);

-- contracts
drop policy if exists "landlords_own_contracts" on contracts;

create policy "contracts_select" on contracts
  for select using (auth.uid() = landlord_id);

create policy "contracts_insert" on contracts
  for insert with check (auth.uid() = landlord_id);

create policy "contracts_update" on contracts
  for update using (auth.uid() = landlord_id)
  with check (auth.uid() = landlord_id);

create policy "contracts_delete" on contracts
  for delete using (auth.uid() = landlord_id);


-- â”€â”€ 4. Performance indexes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
--
-- Supabase auto-creates indexes for primary keys, but not for foreign keys.
-- These are essential once the dataset grows.

create index if not exists idx_properties_landlord      on properties (landlord_id);
create index if not exists idx_rooms_property           on rooms (property_id);
create index if not exists idx_rooms_status             on rooms (status);
create index if not exists idx_tenants_landlord         on tenants (landlord_id);
create index if not exists idx_tenants_room             on tenants (room_id);
create index if not exists idx_tenants_active           on tenants (landlord_id, is_active);
create index if not exists idx_payments_tenant          on payments (tenant_id);
create index if not exists idx_payments_due_date        on payments (due_date);
create index if not exists idx_payments_status          on payments (status);
create index if not exists idx_issues_property          on maintenance_issues (property_id);
create index if not exists idx_issues_tenant            on maintenance_issues (tenant_id);
create index if not exists idx_issues_status            on maintenance_issues (status);
create index if not exists idx_contracts_landlord       on contracts (landlord_id);
create index if not exists idx_contracts_tenant         on contracts (tenant_id);
create index if not exists idx_templates_landlord       on contract_templates (landlord_id);

