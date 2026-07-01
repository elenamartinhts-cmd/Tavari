import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

type PropertyStat = {
  id: string;
  name: string;
  total: number;
  occupied: number;
  rate: number;
};

export default function OccupancyByProperty({
  properties,
  potential,
  actual,
}: {
  properties: PropertyStat[];
  potential: number;
  actual: number;
}) {
  const vacancyLoss = potential - actual;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Ocupación por propiedad
      </h3>

      {properties.length === 0 ? (
        <p className="text-sm text-gray-400 italic py-4 text-center">Sin propiedades</p>
      ) : (
        <div className="space-y-4">
          {properties.map((p) => (
            <div key={p.id}>
              <div className="flex items-center justify-between mb-1.5">
                <Link href={`/properties/${p.id}`} className="text-sm font-medium text-gray-800 hover:text-olive-600 truncate max-w-[60%]">
                  {p.name}
                </Link>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-gray-400">{p.occupied}/{p.total}</span>
                  <span
                    className={`text-xs font-semibold ${
                      p.rate >= 80 ? "text-emerald-600" : p.rate >= 50 ? "text-amber-600" : "text-red-500"
                    }`}
                  >
                    {p.rate}%
                  </span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    p.rate >= 80 ? "bg-emerald-500" : p.rate >= 50 ? "bg-amber-400" : "bg-red-400"
                  }`}
                  style={{ width: `${p.rate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Revenue potential */}
      {potential > 0 && (
        <div className="mt-5 pt-4 border-t border-gray-100 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Renta potencial (100%)</span>
            <span className="font-semibold text-gray-700">{formatCurrency(potential)}/mes</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Renta actual</span>
            <span className="font-semibold text-emerald-600">{formatCurrency(actual)}/mes</span>
          </div>
          {vacancyLoss > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Pérdida por vacancia</span>
              <span className="font-semibold text-red-500">−{formatCurrency(vacancyLoss)}/mes</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
