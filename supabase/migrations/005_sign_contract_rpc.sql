-- Atomic contract signing
--
-- Replaces the client-side read-then-write pattern that had a race condition.
-- Uses FOR UPDATE to lock the row for the duration of the transaction, so two
-- simultaneous sign requests cannot both see "other side not signed" and both
-- write pending_signature.
--
-- Security: manually checks auth.uid() = landlord_id because SECURITY DEFINER
-- bypasses RLS.  Only the landlord can trigger either signature (in this flow).

create or replace function sign_contract(
  p_contract_id uuid,
  p_role        text   -- 'landlord' | 'tenant'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v contracts%rowtype;
begin
  if p_role not in ('landlord', 'tenant') then
    raise exception 'Invalid role: %', p_role;
  end if;

  -- Lock the row so concurrent calls queue up rather than racing
  select * into v
  from contracts
  where id = p_contract_id
  for update;

  if not found then
    raise exception 'Contract not found';
  end if;

  -- Only the landlord of this contract can use this function
  if auth.uid() != v.landlord_id then
    raise exception 'Forbidden';
  end if;

  if p_role = 'landlord' then
    if v.signed_landlord_at is not null then
      raise exception 'Landlord signature already recorded';
    end if;

    update contracts
    set
      signed_landlord_at = now(),
      status = case
        when v.signed_tenant_at is not null then 'active'::contract_status
        else 'pending_signature'::contract_status
      end
    where id = p_contract_id;

  else -- 'tenant'
    if v.signed_tenant_at is not null then
      raise exception 'Tenant signature already recorded';
    end if;

    update contracts
    set
      signed_tenant_at = now(),
      status = case
        when v.signed_landlord_at is not null then 'active'::contract_status
        else 'pending_signature'::contract_status
      end
    where id = p_contract_id;
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

