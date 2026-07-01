import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Building2, Plus, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Property, Room } from "@/lib/types";
import RoomStatusBadge from "@/components/rooms/room-status-badge";
import AddPropertyDialog from "@/components/properties/add-property-dialog";

async function getProperties(landlordId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("properties")
    .select("*, rooms(id, number, status, monthly_rent)")
    .eq("landlord_id", landlordId)
    .order("created_at", { ascending: false });
  return (data ?? []) as (Property & { rooms: Room[] })[];
}

export default async function PropertiesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const properties = await getProperties(user.id);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Propiedades</h1>
          <p className="text-gray-500 mt-0.5">{properties.length} propiedad{properties.length !== 1 ? "es" : ""}</p>
        </div>
        <AddPropertyDialog />
      </div>

      {properties.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}

function PropertyCard({ property }: { property: Property & { rooms: Room[] } }) {
  const rooms = property.rooms ?? [];
  const occupied = rooms.filter((r) => r.status === "occupied").length;
  const vacant = rooms.filter((r) => r.status === "vacant").length;
  const totalRent = rooms.filter((r) => r.status === "occupied").reduce((s, r) => s + r.monthly_rent, 0);

  return (
    <Link
      href={`/properties/${property.id}`}
      className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md hover:border-olive-200 transition-all group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-olive-50 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-olive-600" />
        </div>
        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-olive-500 transition-colors" />
      </div>

      <h3 className="font-semibold text-gray-900 mb-0.5">{property.name}</h3>
      <p className="text-sm text-gray-500 mb-4">{property.address}, {property.city}</p>

      <div className="flex gap-3 mb-4">
        {rooms.map((room) => (
          <RoomStatusBadge key={room.id} status={room.status} size="sm" />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-100">
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">{rooms.length}</p>
          <p className="text-xs text-gray-500">Hab.</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-emerald-600">{occupied}</p>
          <p className="text-xs text-gray-500">Ocupadas</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-gray-400">{vacant}</p>
          <p className="text-xs text-gray-500">Libres</p>
        </div>
      </div>

      {totalRent > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Renta mensual: <span className="font-semibold text-gray-900">{formatCurrency(totalRent)}</span>
          </p>
        </div>
      )}
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <div className="w-16 h-16 bg-olive-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Building2 className="w-8 h-8 text-olive-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Sin propiedades aún</h3>
      <p className="text-gray-500 text-sm mb-6">Añade tu primera propiedad para empezar a gestionar habitaciones.</p>
      <AddPropertyDialog />
    </div>
  );
}
