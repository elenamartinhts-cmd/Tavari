-- Contract templates
create table if not exists contract_templates (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  content text not null default '',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Contracts
create type contract_status as enum (
  'draft',
  'pending_signature',
  'active',
  'expiring',
  'expired',
  'terminated'
);

create table if not exists contracts (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid references auth.users(id) on delete cascade not null,
  tenant_id uuid references tenants(id) on delete cascade not null,
  room_id uuid references rooms(id) on delete set null,
  property_id uuid references properties(id) on delete set null,
  template_id uuid references contract_templates(id) on delete set null,
  generated_content text,
  start_date date not null,
  end_date date,
  monthly_rent numeric(10,2) not null default 0,
  deposit_amount numeric(10,2) not null default 0,
  status contract_status not null default 'draft',
  signed_landlord_at timestamptz,
  signed_tenant_at timestamptz,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- RLS
alter table contract_templates enable row level security;
alter table contracts enable row level security;

create policy "landlords_own_templates" on contract_templates
  for all using (auth.uid() = landlord_id);

create policy "landlords_own_contracts" on contracts
  for all using (auth.uid() = landlord_id);

