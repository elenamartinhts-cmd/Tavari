"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const CODE_RE = /^[A-Z2-9]{8}$/;

export async function joinWithCode(
  code: string
): Promise<{ error?: string; tenantId?: string }> {
  const normalizedCode = code.toUpperCase().trim();

  if (!CODE_RE.test(normalizedCode)) {
    return { error: "El código debe tener 8 caracteres. Compruébalo e inténtalo de nuevo." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const userId = user.id;
  const userEmail = user.email ?? "";
  const userMeta = user.user_metadata ?? {};

  const admin = createAdminClient();

  // Find the room by code
  const { data: room, error: roomError } = await admin
    .from("rooms")
    .select("id, number, property_id, status, properties(id, landlord_id, name)")
    .eq("join_code", normalizedCode)
    .single();

  if (roomError || !room) {
    return { error: "Código no encontrado. Comprueba que lo has introducido correctamente." };
  }

  // Check if room already has an active tenant
  const { data: existingTenant, error: occupiedError } = await admin
    .from("tenants")
    .select("id")
    .eq("room_id", room.id)
    .eq("is_active", true)
    .maybeSingle();

  if (occupiedError) return { error: "Error al verificar disponibilidad. Inténtalo de nuevo." };
  if (existingTenant) {
    return { error: "Este código ya está en uso. Contacta con tu arrendador." };
  }

  // Deactivate any existing active tenant for this user (by user_id or by email with no user_id set yet)
  const { data: existingByUserId } = await admin
    .from("tenants")
    .select("id, room_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  const { data: existingByEmail } = await admin
    .from("tenants")
    .select("id, room_id")
    .eq("email", userEmail)
    .is("user_id", null)
    .eq("is_active", true)
    .maybeSingle();

  for (const existing of [existingByUserId, existingByEmail]) {
    if (!existing) continue;
    await admin.from("tenants").update({ is_active: false }).eq("id", existing.id);
    if (existing.room_id) {
      await admin.from("rooms").update({ status: "vacant" }).eq("id", existing.room_id);
    }
  }

  const property = room.properties as any;
  const landlordId = property?.landlord_id;
  if (!landlordId) return { error: "Propiedad no encontrada." };

  const fullName = (userMeta?.full_name as string | undefined) ?? userEmail;

  // Create tenant record
  const { data: tenant, error: insertError } = await admin
    .from("tenants")
    .insert({
      landlord_id: landlordId,
      user_id: userId,
      full_name: fullName,
      email: userEmail,
      phone: (userMeta?.phone as string | undefined) ?? "",
      room_id: room.id,
      is_active: true,
    })
    .select("id")
    .single();

  if (insertError || !tenant) {
    return { error: "Error al vincular la propiedad. Inténtalo de nuevo." };
  }

  // Mark room as occupied
  await admin.from("rooms").update({ status: "occupied" }).eq("id", room.id);

  // Update user metadata so future logins route correctly
  await admin.auth.admin.updateUserById(userId, {
    user_metadata: {
      ...userMeta,
      role: "tenant",
      tenant_id: tenant.id,
    },
  });

  return { tenantId: tenant.id };
}
