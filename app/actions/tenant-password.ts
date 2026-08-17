"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function setTenantPassword(
  tenantId: string,
  newPassword: string
): Promise<{ error?: string }> {
  if (newPassword.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  const admin = createAdminClient();

  // Verify landlord owns this tenant
  const { data: tenant } = await admin
    .from("tenants")
    .select("user_id")
    .eq("id", tenantId)
    .eq("landlord_id", user.id)
    .single();

  if (!tenant) return { error: "Inquilino no encontrado" };
  if (!tenant.user_id) return { error: "Este inquilino no tiene cuenta activa todavía." };

  const { error } = await admin.auth.admin.updateUser(tenant.user_id, { password: newPassword });
  if (error) return { error: error.message };

  return {};
}
