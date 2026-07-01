create table tenant_notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade not null,
  type text not null default 'expense_summary',
  title text not null,
  data jsonb not null default '{}',
  read_at timestamptz,
  created_at timestamptz default now() not null
);

alter table tenant_notifications enable row level security;

create policy "landlords_insert_notifications" on tenant_notifications
  for insert
  with check (
    exists (
      select 1 from tenants t
      where t.id = tenant_notifications.tenant_id
        and t.landlord_id = auth.uid()
    )
  );

create policy "tenants_read_own_notifications" on tenant_notifications
  for select
  using (
    exists (
      select 1 from tenants t
      where t.id = tenant_notifications.tenant_id
        and t.user_id = auth.uid()
    )
  );

create policy "tenants_update_own_notifications" on tenant_notifications
  for update
  using (
    exists (
      select 1 from tenants t
      where t.id = tenant_notifications.tenant_id
        and t.user_id = auth.uid()
    )
  );

grant select, insert, update on tenant_notifications to authenticated;