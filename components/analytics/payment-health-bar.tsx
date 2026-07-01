import { formatCurrency } from "@/lib/utils";

export default function PaymentHealthBar({
  paid, pending, overdue, partial,
  collectionRate, paidCount, pendingCount, overdueCount,
}: {
  paid: number; pending: number; overdue: number; partial: number;
  collectionRate: number; paidCount: number; pendingCount: number; overdueCount: number;
}) {
  const total = paid + pending + overdue + partial;

  const segments = [
    { label: "Cobrado", amount: paid, color: "bg-emerald-500", textColor: "text-emerald-700", bg: "bg-emerald-50" },
    { label: "Pendiente", amount: pending, color: "bg-amber-400", textColor: "text-amber-700", bg: "bg-amber-50" },
    { label: "Vencido", amount: overdue, color: "bg-red-500", textColor: "text-red-700", bg: "bg-red-50" },
    { label: "Parcial", amount: partial, color: "bg-olive-400", textColor: "text-olive-700", bg: "bg-olive-50" },
  ].filter((s) => s.amount > 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 h-full flex flex-col">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
        Estado de pagos
      </h3>
      <p className="text-xs text-gray-400 mb-5">Mes actual</p>

      {total === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-400 italic">Sin registros este mes</p>
        </div>
      ) : (
        <>
          {/* Collection rate */}
          <div className="text-center mb-5">
            <div className="relative inline-flex items-center justify-center">
              <svg viewBox="0 0 80 80" width="80" height="80">
                <circle cx="40" cy="40" r="32" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                <circle
                  cx="40" cy="40" r="32"
                  fill="none"
                  stroke={collectionRate >= 80 ? "#10b981" : collectionRate >= 50 ? "#f59e0b" : "#ef4444"}
                  strokeWidth="10"
                  strokeDasharray={`${(collectionRate / 100) * 201} 201`}
                  strokeLinecap="round"
                  transform="rotate(-90 40 40)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-gray-900">{collectionRate}%</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">tasa de cobro</p>
          </div>

          {/* Stacked bar */}
          <div className="flex h-3 rounded-full overflow-hidden mb-4">
            {segments.map((s) => (
              <div
                key={s.label}
                className={`${s.color} transition-all`}
                style={{ width: `${(s.amount / total) * 100}%` }}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="space-y-2.5">
            {segments.map((s) => (
              <div key={s.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${s.color}`} />
                  <span className="text-xs text-gray-600">{s.label}</span>
                </div>
                <span className={`text-xs font-semibold ${s.textColor}`}>
                  {formatCurrency(s.amount)}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-xs">
            <span className="text-gray-400">Total esperado</span>
            <span className="font-semibold text-gray-700">{formatCurrency(total)}</span>
          </div>
        </>
      )}
    </div>
  );
}
