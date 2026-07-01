-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- Tenant contract signing (portal, no Supabase Auth session)
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- Update sign_contract to landlord-only (tenant now has its own function)
create or replace function sign_contract(
  p_contract_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v contracts%rowtype;
begin
  select * into v
  from contracts
  where id = p_contract_id
  for update;

  if not found then
    raise exception 'Contract not found';
  end if;

  -- Only the landlord who owns this contract may call this function
  if auth.uid() != v.landlord_id then
    raise exception 'Forbidden';
  end if;

  if v.signed_landlord_at is not null then
    raise exception 'Landlord signature already recorded';
  end if;

  update contracts
  set
    signed_landlord_at = now(),
    -- If tenant already signed somehow, go active; otherwise wait for tenant
    status = case
      when v.signed_tenant_at is not null then 'active'::contract_status
      else 'pending_signature'::contract_status
    end
  where id = p_contract_id;

  return jsonb_build_object('ok', true);
end;
$$;


-- Separate function for tenant signing from the public portal.
-- There is no auth.uid() here; ownership is verified via p_tenant_id.
-- Called only from the server-side portal action using the admin/service-role
-- client â€” the p_tenant_id is fetched from the DB, never trusted from input.
create or replace function sign_contract_as_tenant(
  p_contract_id uuid,
  p_tenant_id   uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v contracts%rowtype;
begin
  -- Lock the row atomically
  select * into v
  from contracts
  where id = p_contract_id
  for update;

  if not found then
    raise exception 'Contract not found';
  end if;

  -- Verify this contract actually belongs to this tenant
  if v.tenant_id != p_tenant_id then
    raise exception 'Forbidden: contract does not belong to this tenant';
  end if;

  -- Enforce the required flow: landlord must sign before tenant
  if v.signed_landlord_at is null then
    raise exception 'Landlord must sign before the tenant';
  end if;

  if v.signed_tenant_at is not null then
    raise exception 'Tenant signature already recorded';
  end if;

  -- Only active contracts make sense to sign
  if v.status not in ('pending_signature', 'draft') then
    raise exception 'Contract is not awaiting signature';
  end if;

  update contracts
  set
    signed_tenant_at = now(),
    status           = 'active'::contract_status
  where id = p_contract_id;

  return jsonb_build_object('ok', true);
end;
$$;

