"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateTenantAssignment(opts: {
  tenantId: string;
  oldRoomId: string | null;
  newRoomId: string | null;
  newMonthlyRent: number | null;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const admin = createAdminClient();
  const { tenantId, oldRoomId, newRoomId, newMonthlyRent } = opts;
  const roomChanged = oldRoomId !== newRoomId;

  // Update tenant room
  if (roomChanged) {
    const { error } = await admin
      .from("tenants")
      .update({ room_id: newRoomId })
      .eq("id", tenantId)
      .eq("landlord_id", user.id);
    if (error) return { error: error.message };

    if (oldRoomId) {
      const { error: e } = await admin.from("rooms").update({ status: "vacant" }).eq("id", oldRoomId);
      if (e) console.error("Failed to set old room vacant:", e.message);
    }
    if (newRoomId) {
      const { error: e } = await admin.from("rooms").update({ status: "occupied" }).eq("id", newRoomId);
      if (e) console.error("Failed to set new room occupied:", e.message);
    }
  }

  // Effective rent: explicit value if given, otherwise auto-apply new room's price when room changed
  let effectiveRent = (newMonthlyRent && newMonthlyRent > 0) ? newMonthlyRent : null;
  if (!effectiveRent && roomChanged && newRoomId) {
    const { data: newRoom } = await admin
      .from("rooms")
      .select("monthly_rent")
      .eq("id", newRoomId)
      .single();
    if (newRoom?.monthly_rent && newRoom.monthly_rent > 0) {
      effectiveRent = newRoom.monthly_rent;
    }
  }

  // Sync room's stored monthly_rent and all future pending payments
  if (effectiveRent) {
    const roomId = newRoomId || oldRoomId;
    if (roomId) {
      const { error: roomRentError } = await admin
        .from("rooms")
        .update({ monthly_rent: effectiveRent })
        .eq("id", roomId);
      if (roomRentError) return { error: "No se pudo actualizar el precio de la habitación: " + roomRentError.message };
    }
    const today = new Date().toISOString().split("T")[0];
    const { error: paymentError } = await admin
      .from("payments")
      .update({ amount: effectiveRent })
      .eq("tenant_id", tenantId)
      .eq("status", "pending")
      .gte("due_date", today);
    if (paymentError) return { error: "No se pudo actualizar el importe de los pagos: " + paymentError.message };
  }

  revalidatePath("/tenants");
  revalidatePath(`/tenants/${tenantId}`);
  return {};
}
