"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

async function findAuthUserByEmail(admin: ReturnType<typeof createAdminClient>, email: string) {
  let page = 1;
  while (true) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    const users = data?.users ?? [];
    const found = users.find((u) => u.email === email);
    if (found) return found;
    if (users.length < 1000) return undefined;
    page++;
  }
}

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
    .select("user_id, email")
    .eq("id", tenantId)
    .eq("landlord_id", user.id)
    .single();

  if (!tenant) return { error: "Inquilino no encontrado" };

  let authUserId = tenant.user_id as string | null;

  // If user_id not linked yet, look up by email and backfill
  if (!authUserId && tenant.email) {
    const existing = await findAuthUserByEmail(admin, tenant.email as string);
    if (!existing) return { error: "Este inquilino aún no ha creado su cuenta." };
    authUserId = existing.id;
    await admin.from("tenants").update({ user_id: authUserId }).eq("id", tenantId);
    revalidatePath(`/tenants/${tenantId}`);
  }

  if (!authUserId) return { error: "Este inquilino aún no ha creado su cuenta." };

  const { error } = await admin.auth.admin.updateUser(authUserId, { password: newPassword });
  if (error) return { error: error.message };

  return {};
}
