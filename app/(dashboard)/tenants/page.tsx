import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Users, ArrowRight, Search } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Tenant, Room, Property } from "@/lib/types";
import AddTenantDialog from "@/components/tenants/add-tenant-dialog";
import TenantStatusBadge from "@/components/tenants/tenant-status-badge";

type TenantRow = Tenant & {
  rooms: (Room & { properties: Property }) | null;
};

async function getTenants(landlordId: string): Promise<TenantRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tenants")
    .select("*, rooms(*, properties(*))")
    .eq("landlord_id", landlordId)
    .order("created_at", { ascending: false });
  return (data ?? []) as TenantRow[];
}

async function getVacantRooms(landlordId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rooms")
    .select("id, number, monthly_rent, properties!inner(id, name, landlord_id)")
    .eq("properties.landlord_id", landlordId)
    .eq("status", "vacant");
  return data ?? [];
}

export default async function TenantsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [tenants, vacantRooms] = await Promise.all([
    getTenants(user.id),
    getVacantRooms(user.id),
  ]);

  const active = tenants.filter((t) => t.is_active);
  const inactive = tenants.filter((t) => !t.is_active);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inquilinos</h1>
          <p className="text-gray-500 mt-0.5">
            {active.length} activo{active.length !== 1 ? "s" : ""}
            {inactive.length > 0 && ` · ${inactive.length} anterior${inactive.length !== 1 ? "es" : ""}`}
          </p>
        </div>
        <AddTenantDialog vacantRooms={vacantRooms as any} />
      </div>

      {tenants.length === 0 ? (
        <EmptyState vacantRooms={vacantRooms as any} />
      ) : (
        <div className="space-y-8">
          {active.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Activos · {active.length}
              </h2>
              <TenantTable tenants={active} />
            </section>
          )}
          {inactive.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Anteriores · {inactive.length}
              </h2>
              <TenantTable tenants={inactive} />
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function TenantTable({ tenants }: { tenants: TenantRow[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Inquilino</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Habitación</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Entrada</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Contacto</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Estado</th>
            <th className="px-6 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {tenants.map((tenant) => (
            <tr key={tenant.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-olive-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-olive-700">
                      {tenant.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{tenant.full_name}</p>
                    {tenant.nationality && (
                      <p className="text-xs text-gray-400">{tenant.nationality}</p>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                {tenant.rooms ? (
                  <div>
                    <p className="font-medium text-gray-700">{tenant.rooms.properties?.name}</p>
                    <p className="text-xs text-gray-400">Hab. {tenant.rooms.number}</p>
                  </div>
                ) : (
                  <span className="text-gray-400 text-xs italic">Sin habitación</span>
                )}
              </td>
              <td className="px-6 py-4 hidden md:table-cell text-gray-600">
                {tenant.move_in_date ? formatDate(tenant.move_in_date) : "—"}
              </td>
              <td className="px-6 py-4 hidden lg:table-cell">
                <p className="text-gray-600">{tenant.email}</p>
                {tenant.phone && <p className="text-xs text-gray-400">{tenant.phone}</p>}
              </td>
              <td className="px-6 py-4">
                <TenantStatusBadge isActive={tenant.is_active} />
              </td>
              <td className="px-6 py-4 text-right">
                <Link
                  href={`/tenants/${tenant.id}`}
                  className="inline-flex items-center gap-1 text-xs text-olive-600 hover:underline font-medium"
                >
                  Ver <ArrowRight className="w-3 h-3" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ vacantRooms }: { vacantRooms: any[] }) {
  return (
    <div className="text-center py-20">
      <div className="w-16 h-16 bg-olive-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Users className="w-8 h-8 text-olive-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Sin inquilinos aún</h3>
      <p className="text-gray-500 text-sm mb-6">Añade tu primer inquilino y asígnalo a una habitación.</p>
      <AddTenantDialog vacantRooms={vacantRooms} />
    </div>
  );
}
