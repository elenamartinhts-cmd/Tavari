-- Link tenant records to auth accounts
alter table tenants add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table tenants add column if not exists invite_sent_at timestamptz;

-- Extra profile fields for Spanish tenancy
alter table tenants add column if not exists emergency_contact_relationship text;
alter table tenants add column if not exists current_address text;
alter table tenants add column if not exists id_expiry_date date;
alter table tenants add column if not exists guarantor_name text;
alter table tenants add column if not exists guarantor_phone text;
alter table tenants add column if not exists guarantor_id_number text;
alter table tenants add column if not exists monthly_income numeric(10,2);

-- One auth user per tenant
create unique index if not exists tenants_user_id_idx on tenants(user_id) where user_id is not null;

-- Tenants can read their own record
create policy "tenants_read_own" on tenants
  for select using (auth.uid() = user_id);

-- Tenants can update their own record (profile completion)
create policy "tenants_update_own" on tenants
  for update using (auth.uid() = user_id);
