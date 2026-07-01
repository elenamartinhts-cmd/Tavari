"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

function formatMonthLong(dateStr: string) {
  const d = new Date(dateStr);
  const name = d.toLocaleString("es-ES", { month: "long", year: "numeric" });
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export async function sendExpensesToTenants(
  propertyId: string,
  periodMonth: string
): Promise<{ error?: string; sentCount?: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  const admin = createAdminClient();
  const periodDate = `${periodMonth}-01`;

  const { data: property } = await admin
    .from("properties")
    .select("name")
    .eq("id", propertyId)
    .eq("landlord_id", user.id)
    .single();

  if (!property) return { error: "Propiedad no encontrada" };

  // All one-off expenses for this month (includes applied recurring instances)
  const { data: monthExpenses } = await admin
    .from("property_expenses")
    .select("category, description, amount, factura_url, expense_shares(tenant_id, amount)")
    .eq("property_id", propertyId)
    .eq("period_month", periodDate)
    .eq("is_recurring", false);

  if (!monthExpenses || monthExpenses.length === 0) {
    return { error: "No hay gastos registrados para este mes. Añade y asigna los gastos primero." };
  }

  // Build per-tenant item list
  const tenantItems = new Map<string, { label: string; amount: number; factura_url: string | null }[]>();
  for (const expense of monthExpenses) {
    const label = expense.description
      ? `${expense.category} — ${expense.description}`
      : expense.category;
    for (const share of expense.expense_shares ?? []) {
      if (!tenantItems.has(share.tenant_id)) tenantItems.set(share.tenant_id, []);
      tenantItems.get(share.tenant_id)!.push({ label, amount: share.amount, factura_url: expense.factura_url });
    }
  }

  if (tenantItems.size === 0) {
    return { error: "No hay repartos asignados a inquilinos. Usa 'Añadir a pagos' primero." };
  }

  const monthLabel = formatMonthLong(periodDate);

  const notifications = Array.from(tenantItems.entries()).map(([tenantId, items]) => ({
    tenant_id: tenantId,
    type: "expense_summary" as const,
    title: `Gastos de ${monthLabel}`,
    data: {
      period_month: periodDate,
      property_name: property.name,
      items,
      total: Math.round(items.reduce((s, i) => s + i.amount, 0) * 100) / 100,
    },
  }));

  const { error: notifError } = await admin.from("tenant_notifications").insert(notifications);
  if (notifError) return { error: notifError.message };

  // Track that landlord sent this month
  await admin.from("expense_notifications").insert({
    property_id: propertyId,
    landlord_id: user.id,
    period_month: periodDate,
    tenant_count: notifications.length,
  });

  revalidatePath(`/properties/${propertyId}`);
  return { sentCount: notifications.length };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function markNotificationRead(tenantId: string, notificationId: string) {
  if (!UUID_RE.test(tenantId) || !UUID_RE.test(notificationId)) return;

  const admin = createAdminClient();
  // Ownership check: a notification can only be marked read by the tenant it belongs to —
  // the portal is reachable without auth, so this can't rely on a session check.
  await admin
    .from("tenant_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("tenant_id", tenantId);
}
