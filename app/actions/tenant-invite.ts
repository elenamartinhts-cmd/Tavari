"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
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

export async function inviteTenant(
  tenantId: string
): Promise<{ error?: string; success?: boolean; alreadyExists?: boolean }> {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { data: tenant } = await supabase
    .from("tenants")
    .select("email, full_name")
    .eq("id", tenantId)
    .eq("landlord_id", user.id)
    .single();

  if (!tenant) return { error: "Inquilino no encontrado" };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { error } = await admin.auth.admin.inviteUserByEmail(tenant.email, {
    data: { role: "tenant", tenant_id: tenantId },
    redirectTo: `${baseUrl}/auth/callback?next=/tenant/setup`,
  });

  if (error) {
    // Email already has a confirmed account — fix their metadata and guide them to use forgot-password
    if (error.message.toLowerCase().includes("already been registered") ||
        error.message.toLowerCase().includes("already registered") ||
        error.message.toLowerCase().includes("user already registered")) {
      const existing = await findAuthUserByEmail(admin, tenant.email);
      if (existing) {
        await admin.auth.admin.updateUserById(existing.id, {
          user_metadata: { role: "tenant", tenant_id: tenantId },
        });
      }
      return { alreadyExists: true };
    }
    return { error: error.message };
  }

  await admin
    .from("tenants")
    .update({ invite_sent_at: new Date().toISOString() })
    .eq("id", tenantId);

  revalidatePath(`/tenants/${tenantId}`);
  return { success: true };
}
