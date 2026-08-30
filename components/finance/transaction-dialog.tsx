"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { CheckCircle2, LoaderCircle, X } from "lucide-react";
import type { Tables } from "@/lib/database.types";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/finance/constants";
import { saveTransaction } from "@/app/protected/actions";
import { dateInTimeZone } from "@/lib/finance/dates";

type Recurring = Pick<Tables<"recurring_expenses">, "id" | "name">;
type Transaction = Tables<"transactions">;

export function TransactionDialog({
  open,
  onClose,
  recurring,
  transaction,
}: {
  open: boolean;
  onClose: () => void;
  recurring: Recurring[];
  transaction?: Transaction;
}) {
  const [kind, setKind] = useState<"income" | "expense">(transaction?.kind ?? "expense");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const firstInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    firstInput.current?.focus();
    const close = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", close);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", close);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  const categories = kind === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  function submit(formData: FormData) {
    setMessage("");
    startTransition(async () => {
      const result = await saveTransaction(formData);
      setMessage(result.message);
      if (result.ok) window.setTimeout(onClose, 500);
    });
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/35 p-0 backdrop-blur-sm sm:items-center sm:p-6" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="transaction-title" className="max-h-[92svh] w-full overflow-y-auto rounded-t-[28px] bg-white p-5 shadow-2xl sm:max-w-xl sm:rounded-[28px] sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Quick entry</p>
            <h2 id="transaction-title" className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950">
              {transaction ? "Edit transaction" : "Add transaction"}
            </h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close transaction form"><X className="size-5" /></button>
        </div>

        <form action={submit} className="mt-6 space-y-5">
          {transaction ? <input type="hidden" name="id" value={transaction.id} /> : null}
          <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1" role="group" aria-label="Transaction type">
            {(["expense", "income"] as const).map((value) => (
              <button key={value} type="button" onClick={() => setKind(value)} className={`rounded-xl px-3 py-2.5 text-sm font-bold capitalize transition ${kind === value ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}>
                {value}
              </button>
            ))}
          </div>
          <input type="hidden" name="kind" value={kind} />

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field-label sm:col-span-2">
              Amount
              <span className="relative mt-2 block">
                <span className="absolute inset-y-0 left-4 flex items-center font-bold text-slate-400">$</span>
                <input ref={firstInput} className="field-input pl-8 text-lg font-bold" name="amount" type="text" inputMode="decimal" placeholder="0.00" required defaultValue={transaction ? (Number(transaction.amount_cents) / 100).toFixed(2) : ""} />
              </span>
            </label>
            <label className="field-label">
              Date
              <input className="field-input mt-2" name="transactionDate" type="date" required defaultValue={transaction?.transaction_date ?? dateInTimeZone()} />
            </label>
            <label className="field-label">
              Category
              <select className="field-input mt-2" name="category" key={kind} defaultValue={transaction?.kind === kind ? transaction.category : categories[0]}>
                {categories.map((category) => <option key={category}>{category}</option>)}
              </select>
            </label>
            <label className="field-label sm:col-span-2">
              {kind === "expense" ? "Merchant" : "Income source"}
              <input className="field-input mt-2" name="merchant" maxLength={120} placeholder={kind === "expense" ? "Where did you spend?" : "Who paid you?"} defaultValue={transaction?.merchant ?? ""} />
            </label>
            <label className="field-label sm:col-span-2">
              Description
              <input className="field-input mt-2" name="description" maxLength={500} placeholder="Optional short description" defaultValue={transaction?.description ?? ""} />
            </label>
            {kind === "expense" && recurring.length ? (
              <label className="field-label sm:col-span-2">
                Recurring bill
                <select className="field-input mt-2" name="recurringExpenseId" defaultValue={transaction?.recurring_expense_id ?? ""}>
                  <option value="">Not linked</option>
                  {recurring.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
                </select>
              </label>
            ) : <input type="hidden" name="recurringExpenseId" value="" />}
            <label className="field-label sm:col-span-2">
              Notes
              <textarea className="field-input mt-2 min-h-24 resize-y py-3" name="notes" maxLength={500} placeholder="Anything else you want to remember" defaultValue={transaction?.notes ?? ""} />
            </label>
          </div>
          {message ? (
            <p role="status" className="flex items-center gap-2 text-sm font-semibold text-slate-600"><CheckCircle2 className="size-4 text-emerald-500" />{message}</p>
          ) : null}
          <button className="primary-button w-full" disabled={pending}>
            {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {pending ? "Saving…" : transaction ? "Save changes" : `Add ${kind}`}
          </button>
        </form>
      </section>
    </div>
  );
}

export function AddTransactionButton({ className = "" }: { className?: string }) {
  return (
    <button type="button" className={`primary-button ${className}`} onClick={() => window.dispatchEvent(new Event("money:add-transaction"))}>
      Add transaction
    </button>
  );
}
