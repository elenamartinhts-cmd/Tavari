"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function MonthNav({
  year, month, prevYear, prevMonth, nextYear, nextMonth, monthName,
}: {
  year: number; month: number;
  prevYear: number; prevMonth: number;
  nextYear: number; nextMonth: number;
  monthName: string;
}) {
  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  return (
    <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-5 py-3 mb-6">
      <Link
        href={`/payments?year=${prevYear}&month=${prevMonth}`}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </Link>

      <div className="text-center">
        <p className="text-sm font-semibold text-gray-900">{monthName} {year}</p>
        {isCurrentMonth && (
          <p className="text-xs text-olive-600 font-medium">Mes actual</p>
        )}
      </div>

      <Link
        href={`/payments?year=${nextYear}&month=${nextMonth}`}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
