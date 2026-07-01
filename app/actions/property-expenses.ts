"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

async function getTenantsInProperty(
  admin: ReturnType<typeof createAdminClient>,
  propertyId: string,
  landlordId: string
) {
  const { data: propertyRooms } = await admin.from("rooms").select("id").eq("property_id", propertyId);
  const roomIds = new Set((propertyRooms ?? []).map((r: { id: string }) => r.id));
  const { data: allTenants } = await admin
    .from("tenants")
    .select("id, room_id, full_name, expenses_included")
    .eq("landlord_id", landlordId)
    .eq("is_active", true);
  return (allTenants ?? []).filter(
    (t: { room_id: string | null }) => t.room_id && roomIds.has(t.room_id)
  ) as { id: string; room_id: string; full_name: string; expenses_included: boolean }[];
}

function buildShares(
  expenseId: string,
  amount: number,
  tenants: { id: string; expenses_included: boolean }[]
) {
  if (tenants.length === 0) return [];
  // Divide by ALL tenants (including expenses_included ones) — their portion is absorbed into rent
  const totalCount = tenants.length;
  const baseShare = Math.floor((amount / totalCount) * 100) / 100;
  const totalBase = Math.round(baseShare * totalCount * 100) / 100;
  const remainder = Math.round((amount - totalBase) * 100) / 100;
  // Only create share records for tenants who actually pay
  const payingTenants = tenants.filter((t) => !t.expenses_included);
  return payingTenants.map((t, i) => ({
    expense_id: expenseId,
    tenant_id: t.id,
    amount: i === 0 ? Math.round((baseShare + remainder) * 100) / 100 : baseShare,
    added_to_payments: false,
  }));
}

export async function addPropertyExpense({
  property_id,
  category,
  description,
  amount,
  period_month,
  factura_url,
  notes,
  is_recurring,
}: {
  property_id: string;
  category: string;
  description: string;
  amount: number;
  period_month: string;
  factura_url?: string;
  notes?: string;
  is_recurring?: boolean;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  const admin = createAdminClient();

  const { data: expense, error: expenseError } = await admin
    .from("property_expenses")
    .insert({
      property_id,
      landlord_id: user.id,
      category,
      description: description || "",
      amount,
      period_month: `${period_month}-01`,
      factura_url: factura_url || null,
      notes: notes || null,
      is_recurring: is_recurring ?? false,
      template_id: null,
    })
    .select("id")
    .single();

  if (expenseError || !expense) return { error: expenseError?.message ?? "Error al guardar el gasto" };

  // Recurring templates get no shares — they're applied per-month on demand
  if (!is_recurring) {
    const tenants = await getTenantsInProperty(admin, property_id, user.id);
    const shares = buildShares(expense.id, amount, tenants);
    if (shares.length > 0) {
      const { error: sharesError } = await admin.from("expense_shares").insert(shares);
      if (sharesError) return { error: sharesError.message };
    }
  }

  revalidatePath(`/properties/${property_id}`);
  return {};
}

// Apply a recurring template to a specific month AND immediately add to payments
export async function applyRecurringToPayments({
  template_id,
  period_month,
  property_id,
}: {
  template_id: string;
  period_month: string; // "YYYY-MM"
  property_id: string;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  const admin = createAdminClient();
  const periodDate = `${period_month}-01`;

  // Load template
  const { data: template } = await admin
    .from("property_expenses")
    .select("*")
    .eq("id", template_id)
    .eq("landlord_id", user.id)
    .single();

  if (!template) return { error: "Gasto fijo no encontrado" };

  // Check if instance already exists for this month
  const { data: existing } = await admin
    .from("property_expenses")
    .select("id")
    .eq("template_id", template_id)
    .eq("period_month", periodDate)
    .maybeSingle();

  let instanceId: string;

  if (existing) {
    instanceId = existing.id;
  } else {
    // Create instance
    const { data: instance, error: instanceError } = await admin
      .from("property_expenses")
      .insert({
        property_id,
        landlord_id: user.id,
        category: template.category,
        description: template.description,
        amount: template.amount,
        period_month: periodDate,
        factura_url: template.factura_url,
        notes: template.notes,
        is_recurring: false,
        template_id: template_id,
      })
      .select("id")
      .single();

    if (instanceError || !instance) return { error: instanceError?.message ?? "Error al aplicar" };
    instanceId = instance.id;

    // Create shares
    const tenants = await getTenantsInProperty(admin, property_id, user.id);
    const shares = buildShares(instanceId, template.amount, tenants);
    if (shares.length > 0) {
      const { error: sharesError } = await admin.from("expense_shares").insert(shares);
      if (sharesError) return { error: sharesError.message };
    }
  }

  // Add to payments (fetch shares fresh)
  const { data: instanceData } = await admin
    .from("property_expenses")
    .select("*, expense_shares(*, tenants(id, room_id))")
    .eq("id", instanceId)
    .single();

  if (!instanceData) return { error: "Error al cargar el gasto" };

  const pendingShares = (instanceData.expense_shares ?? []).filter(
    (s: { added_to_payments: boolean }) => !s.added_to_payments
  );

  if (pendingShares.length > 0) {
    const payments = pendingShares
      .filter((s: { tenants: { room_id: string | null } | null }) => s.tenants?.room_id)
      .map((s: { tenant_id: string; tenants: { room_id: string }; amount: number }) => ({
        tenant_id: s.tenant_id,
        room_id: s.tenants.room_id,
        amount: s.amount,
        due_date: periodDate,
        status: "pending",
        notes: `Gasto compartido: ${template.category}${template.description ? ` — ${template.description}` : ""}`,
      }));

    if (payments.length > 0) {
      const { error: payError } = await admin.from("payments").insert(payments);
      if (payError) return { error: payError.message };
    }

    const shareIds = pendingShares.map((s: { id: string }) => s.id);
    await admin.from("expense_shares").update({ added_to_payments: true }).in("id", shareIds);
  }

  revalidatePath(`/properties/${property_id}`);
  return {};
}

export async function addExpenseToPayments(
  expenseId: string,
  propertyId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  const admin = createAdminClient();

  const { data: expense } = await admin
    .from("property_expenses")
    .select("*, expense_shares(*, tenants(id, room_id, full_name))")
    .eq("id", expenseId)
    .eq("landlord_id", user.id)
    .single();

  if (!expense) return { error: "Gasto no encontrado" };

  const pendingShares = (expense.expense_shares ?? []).filter(
    (s: { added_to_payments: boolean }) => !s.added_to_payments
  );

  if (pendingShares.length === 0) return { error: "Ya añadido a pagos" };

  const payments = pendingShares
    .filter((s: { tenants: { room_id: string | null } | null }) => s.tenants?.room_id)
    .map((s: { tenant_id: string; tenants: { room_id: string }; amount: number }) => ({
      tenant_id: s.tenant_id,
      room_id: s.tenants.room_id,
      amount: s.amount,
      due_date: expense.period_month,
      status: "pending",
      notes: `Gasto compartido: ${expense.category}${expense.description ? ` — ${expense.description}` : ""}`,
    }));

  if (payments.length > 0) {
    const { error: payError } = await admin.from("payments").insert(payments);
    if (payError) return { error: payError.message };
  }

  const shareIds = pendingShares.map((s: { id: string }) => s.id);
  await admin.from("expense_shares").update({ added_to_payments: true }).in("id", shareIds);

  revalidatePath(`/properties/${propertyId}`);
  return {};
}
