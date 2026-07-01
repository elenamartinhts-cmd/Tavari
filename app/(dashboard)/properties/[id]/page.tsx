import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Property, Room, Tenant, PropertyExpense } from "@/lib/types";
import RoomCard from "@/components/rooms/room-card";
import AddRoomDialog from "@/components/rooms/add-room-dialog";
import AddExpenseDialog from "@/components/properties/add-expense-dialog";
import ExpensesSection, { type NotificationRecord } from "@/components/properties/expenses-section";

async function getProperty(id: string, landlordId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("properties")
    .select("*, rooms(*, tenants(id, full_name, move_in_date, is_active))")
    .eq("id", id)
    .eq("landlord_id", landlordId)
    .single();
  return data as (Property & { rooms: (Room & { tenants: Tenant[] })[] }) | null;
}

async function getExpenses(propertyId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("property_expenses")
    .select("*, expense_shares(*, tenants(id, full_name, room_id))")
    .eq("property_id", propertyId)
    .order("period_month", { ascending: false })
    .order("created_at", { ascending: false });
  return (data ?? []) as PropertyExpense[];
}

async function getNotifications(propertyId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("expense_notifications")
    .select("period_month, sent_at, tenant_count")
    .eq("property_id", propertyId)
    .order("sent_at", { ascending: false });
  return (data ?? []) as NotificationRecord[];
}

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [property, expenses, notifications] = await Promise.all([
    getProperty(id, user.id),
    getExpenses(id),
    getNotifications(id),
  ]);

  if (!property) notFound();

  const rooms = property.rooms ?? [];
  const occupied = rooms.filter((r) => r.status === "occupied").length;
  const vacant = rooms.filter((r) => r.status === "vacant").length;
  const maintenance = rooms.filter((r) => r.status === "maintenance").length;
  const reserved = rooms.filter((r) => r.status === "reserved").length;
  const totalRent = rooms.filter((r) => r.status === "occupied").reduce((s, r) => s + r.monthly_rent, 0);

  const activeTenantCount = rooms.reduce((count, r) => {
    return count + (r.tenants ?? []).filter((t) => t.is_active).length;
  }, 0);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <Link href="/properties" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6 w-fit">
        <ChevronLeft className="w-4 h-4" />
        Propiedades
      </Link>

      {/* Property header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{property.name}</h1>
          <p className="text-gray-500 mt-0.5">{property.address}, {property.city} {property.postal_code}</p>
        </div>
        <AddRoomDialog propertyId={property.id} />
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Ocupadas", value: occupied, color: "text-emerald-600" },
          { label: "Libres", value: vacant, color: "text-gray-400" },
          { label: "Reservadas", value: reserved, color: "text-olive-500" },
          { label: "Mantenimiento", value: maintenance, color: "text-amber-500" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {totalRent > 0 && (
        <div className="bg-olive-50 border border-olive-100 rounded-xl px-5 py-3.5 flex items-center justify-between mb-8">
          <p className="text-sm text-olive-700 font-medium">Renta mensual total</p>
          <p className="text-xl font-bold text-olive-800">{formatCurrency(totalRent)}</p>
        </div>
      )}

      {/* Room grid */}
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
        Habitaciones · {rooms.length}
      </h2>

      {rooms.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-400 text-sm mb-3">Esta propiedad aún no tiene habitaciones.</p>
          <AddRoomDialog propertyId={property.id} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {rooms
            .sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }))
            .map((room) => {
              const activeTenant = room.tenants?.find((t) => t.is_active) ?? null;
              return <RoomCard key={room.id} room={room} tenant={activeTenant} />;
            })}
        </div>
      )}

      {/* Expenses section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          Gastos · {expenses.length}
        </h2>
        <AddExpenseDialog propertyId={property.id} activeTenantCount={activeTenantCount} />
      </div>

      <ExpensesSection expenses={expenses} propertyId={property.id} notifications={notifications} />
    </div>
  );
}
