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

    // Old room → vacant
    if (oldRoomId) {
      await admin.from("rooms").update({ status: "vacant" }).eq("id", oldRoomId);
    }
    // New room → occupied
    if (newRoomId) {
      await admin.from("rooms").update({ status: "occupied" }).eq("id", newRoomId);
    }
  }

  // Update future pending payments amount AND room's monthly_rent
  if (newMonthlyRent && newMonthlyRent > 0) {
    const roomId = newRoomId || opts.oldRoomId;
    if (roomId) {
      await admin.from("rooms").update({ monthly_rent: newMonthlyRent }).eq("id", roomId);
    }
    const today = new Date().toISOString().split("T")[0];
    await admin
      .from("payments")
      .update({ amount: newMonthlyRent })
      .eq("tenant_id", tenantId)
      .eq("status", "pending")
      .gte("due_date", today);
  }

  revalidatePath("/tenants");
  revalidatePath(`/tenants/${tenantId}`);
  return {};
}
