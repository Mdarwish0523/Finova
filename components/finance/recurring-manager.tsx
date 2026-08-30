"use client";

import { useState, useTransition } from "react";
import { CalendarCheck, Edit3, LoaderCircle, Pause, Play, Plus, Trash2, X } from "lucide-react";
import type { recurringExpenses } from "@/lib/db/schema";
import { deleteRecurringExpense, markRecurringPaid, saveRecurringExpense, toggleRecurringExpense } from "@/app/protected/actions";
import { EXPENSE_CATEGORIES } from "@/lib/finance/constants";
import { formatCurrency } from "@/lib/finance/format";

type Bill = typeof recurringExpenses.$inferSelect & { paid: boolean; status: "paid" | "overdue" | "upcoming" | "inactive" };

function BillForm({ bill, onClose }: { bill: Bill | null | undefined; onClose: () => void }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await saveRecurringExpense(formData);
      setMessage(result.message);
      if (result.ok) window.setTimeout(onClose, 500);
    });
  }
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/35 backdrop-blur-sm sm:items-center sm:p-6" onMouseDown={(event) => event.currentTarget === event.target && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="bill-title" className="max-h-[92svh] w-full overflow-y-auto rounded-t-[28px] bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-[28px] sm:p-7">
        <div className="flex justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-blue-600">Monthly schedule</p><h2 id="bill-title" className="mt-1 text-2xl font-extrabold">{bill ? "Edit recurring bill" : "Add recurring bill"}</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label="Close"><X className="size-5" /></button></div>
        <form action={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
          {bill ? <input type="hidden" name="id" value={bill.id} /> : null}
          <input type="hidden" name="active" value={bill ? String(bill.active) : "true"} />
          <label className="field-label sm:col-span-2">Name<input autoFocus className="field-input mt-2" name="name" required maxLength={120} placeholder="Rent, internet, gym…" defaultValue={bill?.name} /></label>
          <label className="field-label">Amount<input className="field-input mt-2" name="amount" required inputMode="decimal" placeholder="0.00" defaultValue={bill ? (Number(bill.amount_cents) / 100).toFixed(2) : ""} /></label>
          <label className="field-label">Due day<input className="field-input mt-2" name="dueDay" type="number" min="1" max="31" required defaultValue={bill?.due_day ?? 1} /></label>
          <label className="field-label sm:col-span-2">Category<select className="field-input mt-2" name="category" defaultValue={bill?.category ?? "Housing"}>{EXPENSE_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
          <label className="field-label sm:col-span-2">Notes<textarea className="field-input mt-2 min-h-24 py-3" name="notes" maxLength={500} defaultValue={bill?.notes ?? ""} /></label>
          {message ? <p role="status" className="text-sm font-semibold text-slate-500 sm:col-span-2">{message}</p> : null}
          <button className="primary-button sm:col-span-2" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}{pending ? "Saving…" : "Save recurring bill"}</button>
        </form>
      </section>
    </div>
  );
}

export function RecurringManager({ bills, currency, periodStart, today }: { bills: Bill[]; currency: string; periodStart: string; today: string }) {
  const [editing, setEditing] = useState<Bill | null | undefined>(undefined);
  const [pending, startTransition] = useTransition();
  const total = bills.filter((bill) => bill.active).reduce((sum, bill) => sum + Number(bill.amount_cents), 0);
  function act(task: () => Promise<{ ok: boolean; message: string }>) {
    startTransition(async () => { const result = await task(); if (!result.ok) window.alert(result.message); });
  }
  function remove(bill: Bill) {
    if (window.confirm(`Delete ${bill.name}? Existing linked transactions will remain.`)) act(() => deleteRecurringExpense(bill.id));
  }
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="finance-card p-5 sm:col-span-2"><p className="text-sm font-semibold text-slate-500">Total monthly recurring cost</p><p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">{formatCurrency(total, currency)}</p><p className="mt-2 text-xs text-slate-400">Across {bills.filter((bill) => bill.active).length} active bills</p></div>
        <button type="button" className="min-h-32 rounded-[22px] bg-blue-700 p-5 text-left text-white shadow-xl shadow-blue-200 transition hover:bg-blue-800" onClick={() => setEditing(null)}><Plus className="size-6" /><span className="mt-4 block font-extrabold">Add recurring bill</span><span className="mt-1 block text-xs text-blue-100">Create a monthly schedule</span></button>
      </div>

      {bills.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy={pending}>
          {bills.map((bill) => (
            <article key={bill.id} className={`finance-card p-5 ${!bill.active ? "opacity-65" : ""}`}>
              <div className="flex items-start justify-between gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-blue-50 text-blue-700"><CalendarCheck className="size-5" /></span><span className={`chip ${bill.status === "paid" ? "!bg-emerald-50 !text-emerald-600" : bill.status === "overdue" ? "!bg-rose-50 !text-rose-600" : bill.status === "upcoming" ? "!bg-amber-50 !text-amber-700" : ""}`}>{bill.status}</span></div>
              <h2 className="mt-4 truncate text-lg font-extrabold text-slate-950">{bill.name}</h2>
              <p className="mt-1 text-sm font-semibold text-slate-400">{bill.category} · due day {bill.due_day}</p>
              <p className="mt-5 text-2xl font-extrabold tracking-tight">{formatCurrency(Number(bill.amount_cents), currency)}</p>
              {bill.notes ? <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">{bill.notes}</p> : null}
              <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                {bill.active && !bill.paid ? <button className="secondary-button flex-1" disabled={pending} onClick={() => act(() => markRecurringPaid(bill.id, periodStart, today))}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : <CalendarCheck className="size-4" />}Mark paid</button> : null}
                <button className="icon-button !size-10" onClick={() => setEditing(bill)} aria-label={`Edit ${bill.name}`}><Edit3 className="size-4" /></button>
                <button className="icon-button !size-10" disabled={pending} onClick={() => act(() => toggleRecurringExpense(bill.id, !bill.active))} aria-label={bill.active ? `Pause ${bill.name}` : `Activate ${bill.name}`}>{bill.active ? <Pause className="size-4" /> : <Play className="size-4" />}</button>
                <button className="icon-button !size-10 hover:!border-rose-200 hover:!bg-rose-50 hover:!text-rose-600" disabled={pending} onClick={() => remove(bill)} aria-label={`Delete ${bill.name}`}><Trash2 className="size-4" /></button>
              </div>
            </article>
          ))}
        </div>
      ) : <div className="finance-card py-16 text-center"><CalendarCheck className="mx-auto size-8 text-blue-600" /><h2 className="mt-4 text-lg font-bold">No recurring bills yet</h2><p className="mt-2 text-sm text-slate-400">Add predictable monthly expenses to see upcoming and overdue status.</p></div>}
      {editing !== undefined ? <BillForm bill={editing} onClose={() => setEditing(undefined)} /> : null}
    </>
  );
}
