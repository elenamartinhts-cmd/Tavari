"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function buildPayments(
  moveInDate: string,
  moveOutDate: string | null,
  paymentDay: number,
  monthlyRent: number,
  tenantId: string,
  roomId: string,
) {
  const start = new Date(moveInDate + "T12:00:00");
  const end = moveOutDate
    ? new Date(moveOutDate + "T12:00:00")
    : new Date(start.getFullYear(), start.getMonth() + 24, 1);

  const rows = [];
  let cur = new Date(start.getFullYear(), start.getMonth(), 1);

  while (cur <= end && rows.length < 36) {
    const y = cur.getFullYear();
    const m = cur.getMonth() + 1;
    const day = Math.min(paymentDay, new Date(y, m, 0).getDate());
    rows.push({
      tenant_id: tenantId,
      room_id: roomId,
      amount: monthlyRent,
      due_date: `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      status: "pending",
    });
    cur = new Date(y, m, 1);
  }
  return rows;
}

export async function createAndInviteTenant(formData: {
  full_name: string;
  email: string;
  room_id: string;
  move_in_date: string;
  move_out_date: string;
  expenses_included: boolean;
  payment_day: number;
}): Promise<{ error?: string; tenantId?: string; warning?: string }> {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  // Create tenant record
  const { data: tenant, error: insertError } = await supabase
    .from("tenants")
    .insert({
      landlord_id: user.id,
      full_name: formData.full_name,
      email: formData.email,
      phone: "",
      room_id: formData.room_id || null,
      move_in_date: formData.move_in_date || null,
      move_out_date: formData.move_out_date || null,
      is_active: true,
      expenses_included: formData.expenses_included,
      payment_day: formData.payment_day,
    })
    .select("id")
    .single();

  if (insertError) return { error: insertError.message };

  const tenantId = tenant.id;
  let warning: string | undefined;

  // Auto-generate monthly payments for the contract duration
  if (formData.room_id && formData.move_in_date) {
    const { data: room } = await supabase
      .from("rooms")
      .select("monthly_rent")
      .eq("id", formData.room_id)
      .single();

    if (room) {
      const payments = buildPayments(
        formData.move_in_date,
        formData.move_out_date || null,
        formData.payment_day,
        room.monthly_rent,
        tenantId,
        formData.room_id,
      );
      if (payments.length > 0) {
        await supabase.from("payments").insert(payments);
      }
    }
  }

  // Mark room as occupied — tenant row already exists, so a failure here leaves
  // the room incorrectly shown as vacant; surface it instead of failing silently
  if (formData.room_id) {
    const { error: roomError } = await supabase
      .from("rooms")
      .update({ status: "occupied" })
      .eq("id", formData.room_id);
    if (roomError) {
      console.error("Room status update error:", roomError.message);
      warning = "El inquilino se creó, pero no se pudo marcar la habitación como ocupada. Actualízala manualmente.";
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Send invite email
  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(formData.email, {
    data: { role: "tenant", tenant_id: tenantId },
    redirectTo: `${baseUrl}/auth/callback?next=/tenant/setup`,
  });

  if (inviteError) {
    // Tenant created but invite failed — not fatal, landlord can resend
    console.error("Invite error:", inviteError.message);
  } else {
    await admin
      .from("tenants")
      .update({ invite_sent_at: new Date().toISOString() })
      .eq("id", tenantId);
  }

  revalidatePath("/tenants");
  return { tenantId, warning };
}
