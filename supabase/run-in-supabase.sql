-- Run this entire file in your Supabase SQL editor (once).
-- All statements are idempotent (safe to run again).

-- ── Migration 010: property_expenses & expense_shares ──────────────────────

create table if not exists property_expenses (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) on delete cascade not null,
  landlord_id uuid references auth.users(id) not null,
  category text not null,
  description text not null default '',
  amount numeric(10,2) not null,
  period_month date not null,
  factura_url text,
  notes text,
  created_at timestamptz default now() not null
);

create table if not exists expense_shares (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid references property_expenses(id) on delete cascade not null,
  tenant_id uuid references tenants(id) on delete cascade not null,
  amount numeric(10,2) not null,
  added_to_payments boolean not null default false,
  created_at timestamptz default now() not null
);

do $$ begin
  alter table property_expenses enable row level security;
exception when others then null; end $$;

do $$ begin
  alter table expense_shares enable row level security;
exception when others then null; end $$;

do $$ begin
  create policy "landlords_manage_expenses" on property_expenses
    for all using (auth.uid() = landlord_id)
    with check (auth.uid() = landlord_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "landlords_manage_expense_shares" on expense_shares
    for all
    using (exists (select 1 from property_expenses pe where pe.id = expense_shares.expense_id and pe.landlord_id = auth.uid()))
    with check (exists (select 1 from property_expenses pe where pe.id = expense_shares.expense_id and pe.landlord_id = auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "tenants_view_own_shares" on expense_shares
    for select
    using (exists (select 1 from tenants t where t.id = expense_shares.tenant_id and t.user_id = auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "tenants_view_expenses" on property_expenses
    for select
    using (exists (select 1 from expense_shares es join tenants t on t.id = es.tenant_id where es.expense_id = property_expenses.id and t.user_id = auth.uid()));
exception when duplicate_object then null; end $$;

grant select, insert, update, delete on property_expenses to authenticated;
grant select, insert, update, delete on expense_shares to authenticated;

-- ── Migration 011: recurring flag ──────────────────────────────────────────
alter table property_expenses add column if not exists is_recurring boolean not null default false;

-- ── Migration 012: template_id ─────────────────────────────────────────────
alter table property_expenses add column if not exists template_id uuid references property_expenses(id) on delete set null;

-- ── Migration 013: expense_notifications ───────────────────────────────────
create table if not exists expense_notifications (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) on delete cascade not null,
  landlord_id uuid references auth.users(id) not null,
  period_month date not null,
  tenant_count int not null default 0,
  sent_at timestamptz default now() not null
);

do $$ begin
  alter table expense_notifications enable row level security;
exception when others then null; end $$;

do $$ begin
  create policy "landlords_manage_notifications" on expense_notifications
    for all using (auth.uid() = landlord_id)
    with check (auth.uid() = landlord_id);
exception when duplicate_object then null; end $$;

grant select, insert, update, delete on expense_notifications to authenticated;

-- ── Migration 014: tenant_notifications ────────────────────────────────────
create table if not exists tenant_notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade not null,
  type text not null default 'expense_summary',
  title text not null,
  data jsonb not null default '{}',
  read_at timestamptz,
  created_at timestamptz default now() not null
);

do $$ begin
  alter table tenant_notifications enable row level security;
exception when others then null; end $$;

do $$ begin
  create policy "landlords_insert_notifications" on tenant_notifications
    for insert
    with check (exists (select 1 from tenants t where t.id = tenant_notifications.tenant_id and t.landlord_id = auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "tenants_read_own_notifications" on tenant_notifications
    for select
    using (exists (select 1 from tenants t where t.id = tenant_notifications.tenant_id and t.user_id = auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "tenants_update_own_notifications" on tenant_notifications
    for update
    using (exists (select 1 from tenants t where t.id = tenant_notifications.tenant_id and t.user_id = auth.uid()));
exception when duplicate_object then null; end $$;

grant select, insert, update on tenant_notifications to authenticated;

-- ── Migration 015: expenses_included on tenants ────────────────────────────
alter table tenants add column if not exists expenses_included boolean not null default false;
