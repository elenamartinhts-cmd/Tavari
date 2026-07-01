"use client";

import { useState, useTransition } from "react";
import {
  ExternalLink, Receipt, CheckCircle, Loader2,
  ChevronDown, ChevronRight, RefreshCw, Send,
} from "lucide-react";
import { addExpenseToPayments, applyRecurringToPayments } from "@/app/actions/property-expenses";
import { sendExpensesToTenants } from "@/app/actions/send-expenses";
import type { PropertyExpense } from "@/lib/types";

export type NotificationRecord = { period_month: string; sent_at: string; tenant_count: number };

const CATEGORY_COLORS: Record<string, string> = {
  "Electricidad": "bg-amber-100 text-amber-700",
  "Agua": "bg-blue-100 text-blue-700",
  "Gas": "bg-orange-100 text-orange-700",
  "Comunidad de propietarios": "bg-purple-100 text-purple-700",
  "Seguro del hogar": "bg-indigo-100 text-indigo-700",
  "Internet/WiFi": "bg-sky-100 text-sky-700",
  "Limpieza": "bg-teal-100 text-teal-700",
  "IBI": "bg-red-100 text-red-700",
  "Mantenimiento": "bg-yellow-100 text-yellow-700",
  "Otro": "bg-gray-100 text-gray-700",
};

function formatEur(n: number) {
  return n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

function formatMonthKey(key: string) {
  const [year, month] = key.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  const name = d.toLocaleString("es-ES", { month: "long" });
  return name.charAt(0).toUpperCase() + name.slice(1) + " " + year;
}

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function periodToKey(dateStr: string) {
  return dateStr.slice(0, 7);
}

// Generate "YYYY-MM" keys from startKey up to endKey (both inclusive), descending
function generateMonthRange(startKey: string, endKey: string): string[] {
  const result: string[] = [];
  let [y, m] = endKey.split("-").map(Number);
  const [sy, sm] = startKey.split("-").map(Number);
  while (y > sy || (y === sy && m >= sm)) {
    result.push(`${y}-${String(m).padStart(2, "0")}`);
    m--;
    if (m === 0) { m = 12; y--; }
  }
  return result;
}

// ─── One-off expense row ────────────────────────────────────────────────────

function ExpenseRow({ expense, propertyId }: { expense: PropertyExpense; propertyId: string }) {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(
    (expense.expense_shares ?? []).length > 0 &&
    (expense.expense_shares ?? []).every((s) => s.added_to_payments)
  );
  const [err, setErr] = useState<string | null>(null);
  const shares = expense.expense_shares ?? [];
  const allAdded = shares.length > 0 && shares.every((s) => s.added_to_payments);
  const categoryColor = CATEGORY_COLORS[expense.category] ?? "bg-gray-100 text-gray-700";

  function handleAddToPayments() {
    startTransition(async () => {
      const result = await addExpenseToPayments(expense.id, propertyId);
      if (result.error) { setErr(result.error); return; }
      setDone(true);
    });
  }

  return (
    <div className="py-4 border-b border-gray-100 last:border-0">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryColor}`}>
            {expense.category}
          </span>
          {expense.description && <span className="text-sm text-gray-700">{expense.description}</span>}
        </div>
        <span className="text-sm font-bold text-gray-900 shrink-0">{formatEur(expense.amount)}</span>
      </div>

      {expense.notes && <p className="text-xs text-gray-400 mb-2">{expense.notes}</p>}

      {shares.length > 0 && (
        <div className="mt-2 pl-2 border-l-2 border-gray-100 space-y-1">
          {shares.map((share) => (
            <div key={share.id} className="flex items-center justify-between">
              <span className="text-xs text-gray-500">{share.tenants?.full_name ?? "Inquilino"}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-gray-700">{formatEur(share.amount)}</span>
                {share.added_to_payments && <CheckCircle className="w-3 h-3 text-olive-500" />}
              </div>
            </div>
          ))}
        </div>
      )}

      {shares.length === 0 && (
        <p className="text-xs text-gray-400 mt-1 pl-2">Sin inquilinos activos al registrar.</p>
      )}

      <div className="flex items-center gap-3 mt-3 flex-wrap">
        {expense.factura_url && (
          <a href={expense.factura_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-olive-600 hover:text-olive-800 transition-colors">
            <Receipt className="w-3.5 h-3.5" />
            Ver factura
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
        {shares.length > 0 && !done && !allAdded && (
          <button onClick={handleAddToPayments} disabled={isPending}
            className="flex items-center gap-1 text-xs text-olive-600 hover:text-olive-800 disabled:opacity-50 transition-colors">
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
            Añadir a pagos
          </button>
        )}
        {(done || allAdded) && shares.length > 0 && (
          <span className="flex items-center gap-1 text-xs text-olive-500">
            <CheckCircle className="w-3.5 h-3.5" /> Añadido a pagos
          </span>
        )}
        {err && <p className="text-xs text-red-600">{err}</p>}
      </div>
    </div>
  );
}

// ─── Recurring expense row (appears in every month) ─────────────────────────

function RecurringRow({
  template,
  monthKey,
  instance,
  propertyId,
}: {
  template: PropertyExpense;
  monthKey: string;
  instance: PropertyExpense | null;
  propertyId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const alreadyPaid = instance !== null &&
    (instance.expense_shares ?? []).length > 0 &&
    (instance.expense_shares ?? []).every((s) => s.added_to_payments);
  const [done, setDone] = useState(alreadyPaid);
  const [err, setErr] = useState<string | null>(null);
  const shares = instance?.expense_shares ?? [];
  const categoryColor = CATEGORY_COLORS[template.category] ?? "bg-gray-100 text-gray-700";

  function handleApplyAndPay() {
    startTransition(async () => {
      const result = await applyRecurringToPayments({
        template_id: template.id,
        period_month: monthKey,
        property_id: propertyId,
      });
      if (result.error) { setErr(result.error); return; }
      setDone(true);
    });
  }

  return (
    <div className="py-4 border-b border-gray-100 last:border-0">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <RefreshCw className="w-3 h-3 text-olive-400 shrink-0" />
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryColor}`}>
            {template.category}
          </span>
          {template.description && <span className="text-sm text-gray-600">{template.description}</span>}
        </div>
        <span className="text-sm font-bold text-gray-900 shrink-0">{formatEur(template.amount)}</span>
      </div>

      {/* Show split if instance exists */}
      {shares.length > 0 && (
        <div className="mt-2 pl-2 border-l-2 border-gray-100 space-y-1">
          {shares.map((share) => (
            <div key={share.id} className="flex items-center justify-between">
              <span className="text-xs text-gray-500">{share.tenants?.full_name ?? "Inquilino"}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-gray-700">{formatEur(share.amount)}</span>
                {share.added_to_payments && <CheckCircle className="w-3 h-3 text-olive-500" />}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 mt-3 flex-wrap">
        {template.factura_url && (
          <a href={template.factura_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-olive-600 hover:text-olive-800 transition-colors">
            <Receipt className="w-3.5 h-3.5" />
            Ver factura
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
        {!done && (
          <button onClick={handleApplyAndPay} disabled={isPending}
            className="flex items-center gap-1 text-xs text-olive-600 hover:text-olive-800 disabled:opacity-50 transition-colors">
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
            Añadir a pagos
          </button>
        )}
        {done && (
          <span className="flex items-center gap-1 text-xs text-olive-500">
            <CheckCircle className="w-3.5 h-3.5" /> Añadido a pagos
          </span>
        )}
        {err && <p className="text-xs text-red-600">{err}</p>}
      </div>
    </div>
  );
}

// ─── Month accordion ────────────────────────────────────────────────────────

function MonthGroup({
  monthKey,
  oneOffExpenses,
  recurringTemplates,
  instancesByTemplate,
  propertyId,
  defaultOpen,
  lastSent,
}: {
  monthKey: string;
  oneOffExpenses: PropertyExpense[];
  recurringTemplates: PropertyExpense[];
  instancesByTemplate: Map<string, PropertyExpense>;
  propertyId: string;
  defaultOpen: boolean;
  lastSent: NotificationRecord | null;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [isSending, startSendTransition] = useTransition();
  const [sentInfo, setSentInfo] = useState<{ count: number; at: string } | null>(
    lastSent
      ? { count: lastSent.tenant_count, at: new Date(lastSent.sent_at).toLocaleDateString("es-ES", { day: "numeric", month: "short" }) }
      : null
  );
  const [sendErr, setSendErr] = useState<string | null>(null);

  const oneOffTotal = oneOffExpenses.reduce((s, e) => s + e.amount, 0);
  const recurringTotal = recurringTemplates.reduce((s, t) => s + t.amount, 0);
  const total = oneOffTotal + recurringTotal;
  const hasContent = oneOffExpenses.length > 0 || recurringTemplates.length > 0;

  function handleSend(e: React.MouseEvent) {
    e.stopPropagation();
    setSendErr(null);
    startSendTransition(async () => {
      const result = await sendExpensesToTenants(propertyId, monthKey);
      if (result.error) { setSendErr(result.error); return; }
      setSentInfo({
        count: result.sentCount ?? 0,
        at: new Date().toLocaleDateString("es-ES", { day: "numeric", month: "short" }),
      });
    });
  }

  return (
    <div className={`bg-white rounded-xl border overflow-hidden ${hasContent ? "border-gray-200" : "border-gray-100"}`}>
      {/* Header row */}
      <div className="flex items-center px-5 py-4 hover:bg-gray-50 transition-colors">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
        >
          {open
            ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
            : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
          }
          <span className={`font-semibold text-sm ${hasContent ? "text-gray-900" : "text-gray-400"}`}>
            {formatMonthKey(monthKey)}
          </span>
          {oneOffExpenses.length > 0 && (
            <span className="text-xs text-gray-400">
              {oneOffExpenses.length} {oneOffExpenses.length === 1 ? "gasto" : "gastos"}
            </span>
          )}
        </button>

        {/* Send button + total */}
        <div className="flex items-center gap-3 shrink-0 ml-3">
          {total > 0 && (
            <span className="text-sm font-bold text-gray-800">{formatEur(total)}</span>
          )}

          {sentInfo ? (
            <button
              onClick={handleSend}
              disabled={isSending}
              className="flex items-center gap-1.5 text-xs text-olive-600 border border-olive-200 bg-olive-50 hover:bg-olive-100 rounded-lg px-2.5 py-1.5 transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Enviado {sentInfo.at} · Reenviar
            </button>
          ) : (
            hasContent && (
              <button
                onClick={handleSend}
                disabled={isSending}
                className="flex items-center gap-1.5 text-xs text-white bg-olive-600 hover:bg-olive-700 rounded-lg px-2.5 py-1.5 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {isSending
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Send className="w-3.5 h-3.5" />
                }
                Enviar a inquilinos
              </button>
            )
          )}
        </div>
      </div>

      {sendErr && (
        <div className="px-5 pb-3">
          <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{sendErr}</p>
        </div>
      )}

      {open && (
        <div className="px-5 border-t border-gray-100">
          {oneOffExpenses.map((expense) => (
            <ExpenseRow key={expense.id} expense={expense} propertyId={propertyId} />
          ))}
          {recurringTemplates.map((template) => (
            <RecurringRow
              key={template.id}
              template={template}
              monthKey={monthKey}
              instance={instancesByTemplate.get(template.id) ?? null}
              propertyId={propertyId}
            />
          ))}
          {!hasContent && (
            <p className="text-xs text-gray-300 py-4">No hay gastos este mes.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main export ────────────────────────────────────────────────────────────

export default function ExpensesSection({
  expenses,
  propertyId,
  notifications,
}: {
  expenses: PropertyExpense[];
  propertyId: string;
  notifications: NotificationRecord[];
}) {
  const recurring = expenses.filter((e) => e.is_recurring);
  const instances = expenses.filter((e) => !e.is_recurring && e.template_id !== null);
  const oneOff = expenses.filter((e) => !e.is_recurring && e.template_id === null);

  if (recurring.length === 0 && oneOff.length === 0 && instances.length === 0) {
    return (
      <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
        <Receipt className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-400 text-sm">No hay gastos registrados todavía.</p>
      </div>
    );
  }

  // Figure out month range to display
  const thisMonth = currentMonthKey();

  // Start from 6 months ago, or the earliest expense — whichever is older
  const sixMonthsAgo = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 5);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  })();

  const allExpenseDates = [...oneOff, ...instances].map((e) => periodToKey(e.period_month));
  const earliestExpense = allExpenseDates.sort()[0] ?? thisMonth;
  const startKey = earliestExpense < sixMonthsAgo ? earliestExpense : sixMonthsAgo;

  const months = generateMonthRange(startKey, thisMonth);

  // One-off expenses grouped by month key
  const oneOffByMonth = new Map<string, PropertyExpense[]>();
  for (const e of oneOff) {
    const k = periodToKey(e.period_month);
    if (!oneOffByMonth.has(k)) oneOffByMonth.set(k, []);
    oneOffByMonth.get(k)!.push(e);
  }

  // For each recurring template, map templateId → (monthKey → instance)
  const instancesByTemplateAndMonth = new Map<string, Map<string, PropertyExpense>>();
  for (const inst of instances) {
    if (!inst.template_id) continue;
    if (!instancesByTemplateAndMonth.has(inst.template_id)) {
      instancesByTemplateAndMonth.set(inst.template_id, new Map());
    }
    instancesByTemplateAndMonth.get(inst.template_id)!.set(periodToKey(inst.period_month), inst);
  }

  // Build notification lookup: monthKey → most recent notification
  const notifByMonth = new Map<string, NotificationRecord>();
  for (const n of notifications) {
    const key = periodToKey(n.period_month);
    const existing = notifByMonth.get(key);
    if (!existing || n.sent_at > existing.sent_at) notifByMonth.set(key, n);
  }

  return (
    <div className="space-y-3">
      {months.map((monthKey, idx) => {
        const instancesByTemplate = new Map<string, PropertyExpense>();
        for (const template of recurring) {
          const inst = instancesByTemplateAndMonth.get(template.id)?.get(monthKey);
          if (inst) instancesByTemplate.set(template.id, inst);
        }

        return (
          <MonthGroup
            key={monthKey}
            monthKey={monthKey}
            oneOffExpenses={oneOffByMonth.get(monthKey) ?? []}
            recurringTemplates={recurring}
            instancesByTemplate={instancesByTemplate}
            propertyId={propertyId}
            defaultOpen={idx === 0}
            lastSent={notifByMonth.get(monthKey) ?? null}
          />
        );
      })}
    </div>
  );
}
