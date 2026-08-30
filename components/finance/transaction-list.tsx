"use client";

import { useCallback, useState, useTransition } from "react";
import { ArrowDownRight, ArrowUpRight, Edit3, LoaderCircle, Trash2 } from "lucide-react";
import type { Tables } from "@/lib/database.types";
import { deleteTransaction } from "@/app/protected/actions";
import { formatCurrency, formatDate } from "@/lib/finance/format";
import { TransactionDialog } from "@/components/finance/transaction-dialog";

type Transaction = Tables<"transactions">;
type Recurring = Pick<Tables<"recurring_expenses">, "id" | "name">;

export function TransactionList({ transactions, recurring, currency }: {
  transactions: Transaction[];
  recurring: Recurring[];
  currency: string;
}) {
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [pending, startTransition] = useTransition();
  const close = useCallback(() => setEditing(null), []);
  const groups = transactions.reduce<Record<string, Transaction[]>>((acc, transaction) => {
    (acc[transaction.transaction_date] ??= []).push(transaction);
    return acc;
  }, {});

  function remove(transaction: Transaction) {
    if (!window.confirm(`Delete ${transaction.merchant || transaction.description || "this transaction"}? This cannot be undone.`)) return;
    startTransition(async () => {
      const result = await deleteTransaction(transaction.id);
      if (!result.ok) window.alert(result.message);
    });
  }

  if (!transactions.length) {
    return (
      <div className="finance-card px-5 py-16 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-blue-50 text-blue-700"><ArrowDownRight className="size-6" /></span>
        <h2 className="mt-4 text-lg font-bold text-slate-900">No transactions found</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">Try clearing your filters or add a transaction to start tracking your cash flow.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6" aria-busy={pending}>
        {Object.entries(groups).map(([date, items]) => (
          <section key={date}>
            <h2 className="mb-3 px-1 text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">{formatDate(date, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</h2>
            <div className="finance-card divide-y divide-slate-100 overflow-hidden">
              {items.map((transaction) => (
                <div key={transaction.id} className="group flex items-center gap-3 p-4 sm:px-5">
                  <span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${transaction.kind === "income" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                    {transaction.kind === "income" ? <ArrowUpRight className="size-5" /> : <ArrowDownRight className="size-5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-slate-900">{transaction.merchant || transaction.description || transaction.category}</p>
                    <p className="mt-1 truncate text-xs text-slate-400">{transaction.category}{transaction.description ? ` · ${transaction.description}` : ""}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-extrabold tabular-nums ${transaction.kind === "income" ? "text-emerald-600" : "text-slate-950"}`}>{transaction.kind === "income" ? "+" : "−"}{formatCurrency(Number(transaction.amount_cents), currency)}</p>
                    {transaction.recurring_expense_id ? <span className="mt-1 inline-block text-[10px] font-bold uppercase text-blue-600">Recurring</span> : null}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button type="button" onClick={() => setEditing(transaction)} className="grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-blue-50 hover:text-blue-700" aria-label="Edit transaction"><Edit3 className="size-4" /></button>
                    <button type="button" onClick={() => remove(transaction)} disabled={pending} className="grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-600" aria-label="Delete transaction">{pending ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
      <TransactionDialog open={editing !== null} onClose={close} recurring={recurring} transaction={editing ?? undefined} />
    </>
  );
}
