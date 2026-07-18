"use client";

interface MonthBar { label: string; amount: number }

const COL = 90, BAR = 54, OFF = (COL - BAR) / 2;
const CHART_H = 80, TOP = 24, BOT = 22, SVG_H = TOP + CHART_H + BOT;

export default function MonthlyChart({ data }: { data: MonthBar[] }) {
  const max = Math.max(...data.map(d => d.amount), 1);
  const W = data.length * COL;
  const base = TOP + CHART_H;

  return (
    <svg viewBox={`0 0 ${W} ${SVG_H}`} className="w-full" style={{ height: 130 }}>
      {[0.25, 0.5, 0.75, 1].map(f => (
        <line key={f} x1={0} y1={TOP + CHART_H * (1 - f)} x2={W} y2={TOP + CHART_H * (1 - f)}
          stroke="#F3F4F6" strokeWidth={1} />
      ))}

      {data.map((d, i) => {
        const isLast = i === data.length - 1;
        const barH = d.amount > 0 ? Math.max((d.amount / max) * CHART_H, 4) : 0;
        const x = i * COL + OFF;
        const y = base - barH;

        return (
          <g key={i}>
            {barH > 0
              ? <rect x={x} y={y} width={BAR} height={barH} rx={5}
                  fill={isLast ? "#2E8B57" : "#A9DBBF"} />
              : <rect x={x} y={base - 3} width={BAR} height={3} rx={2} fill="#F3F4F6" />
            }
            {d.amount > 0 && (
              <text x={x + BAR / 2} y={y - 5} textAnchor="middle" fontSize={9}
                fill={isLast ? "#1E6940" : "#6B7280"} fontWeight={isLast ? "700" : "500"}>
                €{d.amount >= 1000 ? `${(d.amount / 1000).toFixed(1)}k` : d.amount}
              </text>
            )}
            <text x={x + BAR / 2} y={SVG_H - 3} textAnchor="middle" fontSize={10}
              fill={isLast ? "#2E8B57" : "#9CA3AF"} fontWeight={isLast ? "600" : "400"}>
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
