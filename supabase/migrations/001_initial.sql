-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Properties
create table if not exists properties (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  address text not null,
  city text not null default 'Madrid',
  postal_code text not null default '',
  country text not null default 'EspaÃ±a',
  created_at timestamptz default now() not null
);

-- Rooms
create type room_status as enum ('vacant', 'reserved', 'occupied', 'maintenance');

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) on delete cascade not null,
  number text not null,
  monthly_rent numeric(10,2) not null default 0,
  deposit_amount numeric(10,2) not null default 0,
  size_sqm numeric(5,1),
  amenities text[] default '{}',
  status room_status not null default 'vacant',
  floor int,
  notes text,
  created_at timestamptz default now() not null,
  unique(property_id, number)
);

-- Tenants
create type id_doc_type as enum ('dni', 'nie', 'passport');

create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid references auth.users(id) on delete cascade not null,
  room_id uuid references rooms(id) on delete set null,
  full_name text not null,
  email text not null,
  phone text not null default '',
  date_of_birth date,
  nationality text,
  id_type id_doc_type,
  id_number text,
  employer text,
  position text,
  emergency_contact_name text,
  emergency_contact_phone text,
  move_in_date date,
  move_out_date date,
  is_active boolean not null default true,
  created_at timestamptz default now() not null
);

-- Payments
create type payment_status as enum ('paid', 'pending', 'overdue', 'partial');

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade not null,
  room_id uuid references rooms(id) on delete cascade not null,
  amount numeric(10,2) not null,
  due_date date not null,
  paid_date date,
  status payment_status not null default 'pending',
  notes text,
  created_at timestamptz default now() not null
);

-- Maintenance issues
create type issue_priority as enum ('low', 'medium', 'urgent');
create type issue_status as enum ('open', 'in_progress', 'waiting_tenant', 'resolved', 'closed');

create table if not exists maintenance_issues (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) on delete cascade not null,
  room_id uuid references rooms(id) on delete set null,
  tenant_id uuid references tenants(id) on delete set null,
  title text not null,
  description text not null default '',
  category text not null default 'other',
  priority issue_priority not null default 'medium',
  status issue_status not null default 'open',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- RLS policies
alter table properties enable row level security;
alter table rooms enable row level security;
alter table tenants enable row level security;
alter table payments enable row level security;
alter table maintenance_issues enable row level security;

-- Landlord can manage their own properties
create policy "landlords_own_properties" on properties
  for all using (auth.uid() = landlord_id);

-- Landlord can manage rooms in their properties
create policy "landlords_own_rooms" on rooms
  for all using (
    exists (select 1 from properties where properties.id = rooms.property_id and properties.landlord_id = auth.uid())
  );

-- Landlord can manage their tenants
create policy "landlords_own_tenants" on tenants
  for all using (auth.uid() = landlord_id);

-- Landlord can manage payments for their tenants
create policy "landlords_own_payments" on payments
  for all using (
    exists (select 1 from tenants where tenants.id = payments.tenant_id and tenants.landlord_id = auth.uid())
  );

-- Landlord can manage issues in their properties
create policy "landlords_own_issues" on maintenance_issues
  for all using (
    exists (select 1 from properties where properties.id = maintenance_issues.property_id and properties.landlord_id = auth.uid())
  );

-- Seed demo data function (call manually after auth user created)
-- Usage: select seed_demo_data('<your-user-uuid>');
create or replace function seed_demo_data(p_landlord_id uuid)
returns void language plpgsql security definer as $$
declare
  prop1_id uuid := gen_random_uuid();
  prop2_id uuid := gen_random_uuid();
  prop3_id uuid := gen_random_uuid();
  room_ids uuid[];
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
  -- Properties
  insert into properties (id, landlord_id, name, address, city, postal_code) values
    (prop1_id, p_landlord_id, 'Calle AlcalÃ¡ 45', 'Calle AlcalÃ¡ 45', 'Madrid', '28014'),
    (prop2_id, p_landlord_id, 'Gran VÃ­a 120', 'Gran VÃ­a 120', 'Madrid', '28013'),
    (prop3_id, p_landlord_id, 'Calle Fuencarral 8', 'Calle Fuencarral 8', 'Madrid', '28004');

  -- Rooms for property 1 (5 rooms)
  insert into rooms (id, property_id, number, monthly_rent, deposit_amount, size_sqm, amenities, status) values
    (room1_id, prop1_id, '1', 550, 1100, 12.5, ARRAY['wifi','desk','wardrobe'], 'occupied'),
    (room2_id, prop1_id, '2', 600, 1200, 14.0, ARRAY['wifi','desk','wardrobe','balcony'], 'occupied'),
    (room3_id, prop1_id, '3', 500, 1000, 11.0, ARRAY['wifi','desk'], 'vacant'),
    (room4_id, prop1_id, '4', 575, 1150, 13.0, ARRAY['wifi','desk','wardrobe'], 'occupied'),
    (room5_id, prop1_id, '5', 525, 1050, 11.5, ARRAY['wifi','desk'], 'maintenance');

  -- Rooms for property 2 (5 rooms)
  insert into rooms (id, property_id, number, monthly_rent, deposit_amount, size_sqm, amenities, status) values
    (room6_id, prop2_id, '1', 650, 1300, 15.0, ARRAY['wifi','desk','wardrobe','ensuite'], 'occupied'),
    (room7_id, prop2_id, '2', 620, 1240, 14.0, ARRAY['wifi','desk','wardrobe'], 'occupied'),
    (room8_id, prop2_id, '3', 580, 1160, 12.5, ARRAY['wifi','desk'], 'occupied'),
    (room9_id, prop2_id, '4', 600, 1200, 13.5, ARRAY['wifi','desk','wardrobe'], 'reserved'),
    (room10_id, prop2_id, '5', 570, 1140, 12.0, ARRAY['wifi','desk'], 'occupied');

  -- Rooms for property 3 (4 rooms)
  insert into rooms (id, property_id, number, monthly_rent, deposit_amount, size_sqm, amenities, status) values
    (room11_id, prop3_id, '1', 480, 960, 10.5, ARRAY['wifi','desk'], 'occupied'),
    (room12_id, prop3_id, '2', 500, 1000, 11.0, ARRAY['wifi','desk','wardrobe'], 'occupied'),
    (room13_id, prop3_id, '3', 460, 920, 10.0, ARRAY['wifi'], 'vacant'),
    (room14_id, prop3_id, '4', 490, 980, 10.5, ARRAY['wifi','desk'], 'occupied');

  -- Tenants
  insert into tenants (id, landlord_id, room_id, full_name, email, phone, nationality, move_in_date, is_active) values
    (tenant1_id, p_landlord_id, room1_id, 'Carlos GarcÃ­a LÃ³pez', 'carlos.garcia@email.com', '+34 612 345 678', 'EspaÃ±ola', '2025-09-01', true),
    (tenant2_id, p_landlord_id, room2_id, 'Sophie Martin', 'sophie.martin@email.com', '+34 623 456 789', 'Francesa', '2025-10-15', true),
    (tenant3_id, p_landlord_id, room4_id, 'Ahmed Hassan', 'ahmed.hassan@email.com', '+34 634 567 890', 'MarroquÃ­', '2026-01-01', true);

  -- Payments (current month)
  insert into payments (tenant_id, room_id, amount, due_date, paid_date, status) values
    (tenant1_id, room1_id, 550, '2026-06-05', '2026-06-02', 'paid'),
    (tenant2_id, room2_id, 600, '2026-06-05', null, 'pending'),
    (tenant3_id, room4_id, 575, '2026-06-05', null, 'overdue');

  -- Maintenance issues
  insert into maintenance_issues (property_id, room_id, tenant_id, title, description, category, priority, status) values
    (prop1_id, room5_id, null, 'CalefacciÃ³n no funciona', 'El radiador de la habitaciÃ³n 5 no calienta.', 'heating', 'urgent', 'open'),
    (prop1_id, room2_id, tenant2_id, 'Grifo con goteo', 'El grifo del baÃ±o tiene una pequeÃ±a fuga.', 'plumbing', 'medium', 'in_progress'),
    (prop2_id, room6_id, null, 'Bombilla fundida', 'La bombilla del pasillo estÃ¡ fundida.', 'electricity', 'low', 'open'),
    (prop3_id, null, null, 'RevisiÃ³n internet', 'La conexiÃ³n va lenta en las habitaciones 1 y 2.', 'internet', 'medium', 'open');
end;
$$;

