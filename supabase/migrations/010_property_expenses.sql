create table property_expenses (
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

create table expense_shares (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid references property_expenses(id) on delete cascade not null,
  tenant_id uuid references tenants(id) on delete cascade not null,
  amount numeric(10,2) not null,
  added_to_payments boolean not null default false,
  created_at timestamptz default now() not null
);

alter table property_expenses enable row level security;
alter table expense_shares enable row level security;

create policy "landlords_manage_expenses" on property_expenses
  for all using (auth.uid() = landlord_id)
  with check (auth.uid() = landlord_id);

create policy "landlords_manage_expense_shares" on expense_shares
  for all
  using (
    exists (
      select 1 from property_expenses pe
      where pe.id = expense_shares.expense_id
        and pe.landlord_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from property_expenses pe
      where pe.id = expense_shares.expense_id
        and pe.landlord_id = auth.uid()
    )
  );

create policy "tenants_view_own_shares" on expense_shares
  for select
  using (
    exists (
      select 1 from tenants t
      where t.id = expense_shares.tenant_id
        and t.user_id = auth.uid()
    )
  );

create policy "tenants_view_expenses" on property_expenses
  for select
  using (
    exists (
      select 1 from expense_shares es
      join tenants t on t.id = es.tenant_id
      where es.expense_id = property_expenses.id
        and t.user_id = auth.uid()
    )
  );

grant select, insert, update, delete on property_expenses to authenticated;
grant select, insert, update, delete on expense_shares to authenticated;