create table expense_notifications (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) on delete cascade not null,
  landlord_id uuid references auth.users(id) not null,
  period_month date not null,
  tenant_count int not null default 0,
  sent_at timestamptz default now() not null
);

alter table expense_notifications enable row level security;

create policy "landlords_manage_notifications" on expense_notifications
  for all using (auth.uid() = landlord_id)
  with check (auth.uid() = landlord_id);

grant select, insert, update, delete on expense_notifications to authenticated;