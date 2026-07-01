"use client";

import { formatCurrency } from "@/lib/utils";

type Month = { label: string; key: string; paid: number; pending: number };

export default function RevenueBarChart({ months }: { months: Month[] }) {
  const maxValue = Math.max(...months.map((m) => m.paid + m.pending), 1);
  const totalPaid = months.reduce((s, m) => s + m.paid, 0);
  const currentMonth = months[months.length - 1];

  // SVG dimensions
  const W = 560;
  const H = 180;
  const barW = 32;
  const gapX = (W - months.length * barW) / (months.length + 1);
  const paddingTop = 16;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ingresos mensuales</h3>
          <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(totalPaid)}</p>
          <p className="text-xs text-gray-400">Últimos 12 meses · cobrado</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <LegendDot color="bg-olive-500" label="Cobrado" />
          <LegendDot color="bg-gray-200" label="Pendiente" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H + 28}`}
          width="100%"
          style={{ minWidth: 320 }}
          className="overflow-visible"
        >
          {/* Grid lines */}
          {[0.25, 0.5, 0.75, 1].map((frac) => {
            const y = paddingTop + H - frac * H;
            return (
              <g key={frac}>
                <line x1={0} y1={y} x2={W} y2={y} stroke="#f3f4f6" strokeWidth={1} />
                <text x={0} y={y - 3} fontSize={9} fill="#9ca3af" textAnchor="start">
                  {formatCurrency(maxValue * frac)}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {months.map((m, i) => {
            const x = gapX + i * (barW + gapX);
            const paidH = (m.paid / maxValue) * H;
            const pendingH = (m.pending / maxValue) * H;
            const totalH = paidH + pendingH;
            const isCurrentMonth = i === months.length - 1;

            return (
              <g key={m.key}>
                {/* Pending (bottom of stack behind paid) */}
                {pendingH > 0 && (
                  <rect
                    x={x}
                    y={paddingTop + H - totalH}
                    width={barW}
                    height={pendingH}
                    rx={pendingH > 0 && paidH === 0 ? 4 : 0}
                    fill={isCurrentMonth ? "#E3EDCB" : "#e5e7eb"}
                  />
                )}
                {/* Paid (on top) */}
                {paidH > 0 && (
                  <rect
                    x={x}
                    y={paddingTop + H - paidH - (pendingH > 0 ? pendingH : 0)}
                    width={barW}
                    height={paidH}
                    rx={4}
                    fill={isCurrentMonth ? "#5E7D26" : "#A8C872"}
                  />
                )}
                {/* Empty bar outline */}
                {paidH === 0 && pendingH === 0 && (
                  <rect x={x} y={paddingTop + H - 4} width={barW} height={4} rx={2} fill="#f3f4f6" />
                )}
                {/* Month label */}
                <text
                  x={x + barW / 2}
                  y={paddingTop + H + 16}
                  fontSize={10}
                  fill={isCurrentMonth ? "#5E7D26" : "#9ca3af"}
                  fontWeight={isCurrentMonth ? 600 : 400}
                  textAnchor="middle"
                >
                  {m.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Current month callout */}
      {currentMonth.paid > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>Este mes cobrado</span>
          <span className="font-semibold text-gray-900">{formatCurrency(currentMonth.paid)}</span>
        </div>
      )}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2.5 h-2.5 rounded-sm ${color}`} />
      <span className="text-gray-500">{label}</span>
    </div>
  );
}
