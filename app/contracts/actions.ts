"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ── Landlord signs ─────────────────────────────────────────────────────────────
// Uses the authenticated server client so RLS + the DB function's own
// auth.uid() check both verify ownership.
export async function signContractAsLandlord(
  contractId: string
): Promise<{ error?: string }> {
  if (!UUID_RE.test(contractId)) return { error: "Invalid contract ID." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("sign_contract", {
    p_contract_id: contractId,
  });

  if (error) return { error: error.message };
  revalidatePath(`/contracts/${contractId}`);
  return {};
}

// ── Tenant signs (called from portal server action, not directly from UI) ──────
// Uses the admin client because the tenant has no Supabase Auth session.
// All ownership checks happen inside the DB function.
export async function signContractAsTenant(
  contractId: string,
  tenantId: string
): Promise<{ error?: string }> {
  if (!UUID_RE.test(contractId)) return { error: "Invalid contract ID." };
  if (!UUID_RE.test(tenantId))   return { error: "Invalid tenant ID." };

  // Double-check: tenant must be active and linked to this contract
  const admin = createAdminClient();

  const { data: contract } = await admin
    .from("contracts")
    .select("id, tenant_id, signed_landlord_at, signed_tenant_at, status")
    .eq("id", contractId)
    .single();

  if (!contract)                          return { error: "Contrato no encontrado." };
  if (contract.tenant_id !== tenantId)    return { error: "No tienes acceso a este contrato." };
  if (!contract.signed_landlord_at)       return { error: "El arrendador aún no ha firmado este contrato." };
  if (contract.signed_tenant_at)          return { error: "Ya has firmado este contrato." };

  const { error } = await admin.rpc("sign_contract_as_tenant", {
    p_contract_id: contractId,
    p_tenant_id:   tenantId,
  });

  if (error) return { error: error.message };
  return {};
}
