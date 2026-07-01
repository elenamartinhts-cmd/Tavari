"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { MAINTENANCE_CATEGORY_VALUES } from "@/lib/maintenance";

export type SubmitIssueState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ALLOWED_CATEGORIES = MAINTENANCE_CATEGORY_VALUES;

const ALLOWED_PRIORITIES = new Set(["low", "medium", "urgent"]);

const TITLE_MAX = 500;
const DESCRIPTION_MAX = 5000;

export async function submitIssue(
  tenantId: string,
  _prev: SubmitIssueState,
  formData: FormData
): Promise<SubmitIssueState> {
  // ── Input validation ───────────────────────────────────────────────────────

  // Validate tenantId is a UUID to prevent injection via the URL param
  if (!UUID_RE.test(tenantId)) {
    return { status: "error", message: "Solicitud no válida." };
  }

  const title = formData.get("title")?.toString().trim() ?? "";
  const description = formData.get("description")?.toString().trim() ?? "";
  const category = formData.get("category")?.toString() ?? "other";
  const priority = formData.get("priority")?.toString() ?? "medium";

  if (!title) return { status: "error", message: "El título es obligatorio." };
  if (title.length > TITLE_MAX) {
    return { status: "error", message: `El título no puede superar los ${TITLE_MAX} caracteres.` };
  }
  if (description.length > DESCRIPTION_MAX) {
    return { status: "error", message: `La descripción no puede superar los ${DESCRIPTION_MAX} caracteres.` };
  }
  if (!ALLOWED_CATEGORIES.has(category)) {
    return { status: "error", message: "Categoría no válida." };
  }
  if (!ALLOWED_PRIORITIES.has(priority)) {
    return { status: "error", message: "Prioridad no válida." };
  }

  // ── Tenant verification ────────────────────────────────────────────────────

  const supabase = createAdminClient();

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, room_id, is_active, rooms(id, property_id)")
    .eq("id", tenantId)
    .single();

  if (tenantError || !tenant) {
    return { status: "error", message: "Inquilino no encontrado." };
  }
  if (!tenant.is_active) {
    return { status: "error", message: "Esta cuenta ya no está activa." };
  }

  const room = tenant.rooms as any;
  const propertyId = room?.property_id ?? null;

  if (!propertyId) {
    return { status: "error", message: "No tienes una habitación asignada. Contacta con tu arrendador." };
  }

  // ── Insert ─────────────────────────────────────────────────────────────────

  const { error: insertError } = await supabase.from("maintenance_issues").insert({
    property_id: propertyId,
    room_id: tenant.room_id,
    tenant_id: tenant.id,
    title,
    description,
    category,
    priority,
    status: "open",
  });

  if (insertError) {
    return { status: "error", message: "Error al enviar la incidencia. Inténtalo de nuevo." };
  }

  revalidatePath(`/portal/${tenantId}`);
  return { status: "success" };
}

// ── Tenant signs a contract from the portal ────────────────────────────────────
// All checks are done server-side; the tenant cannot touch any contract
// they are not explicitly linked to.
export async function portalSignContract(
  tenantId: string,
  contractId: string
): Promise<{ error?: string }> {
  if (!UUID_RE.test(tenantId))   return { error: "Solicitud no válida." };
  if (!UUID_RE.test(contractId)) return { error: "Solicitud no válida." };

  // Verify the tenant is active before doing anything
  const supabase = createAdminClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, is_active")
    .eq("id", tenantId)
    .single();

  if (!tenant || !tenant.is_active) {
    return { error: "Acceso denegado." };
  }

  // Delegate to the shared action which performs all further checks
  const { signContractAsTenant } = await import("@/app/contracts/actions");
  const result = await signContractAsTenant(contractId, tenantId);

  if (result.error) return { error: result.error };

  revalidatePath(`/portal/${tenantId}`);
  return {};
}
