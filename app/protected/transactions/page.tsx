import { Suspense } from "react";
import { Filter, Search } from "lucide-react";
import {
  getRecurringNames,
  getSettings,
  getTransactions,
} from "@/lib/db/queries";
import { ALL_CATEGORIES } from "@/lib/finance/constants";
import { AddTransactionButton } from "@/components/finance/transaction-dialog";
import { PageHeader } from "@/components/finance/page-header";
import { TransactionList } from "@/components/finance/transaction-list";

export const metadata = { title: "Transactions" };

type Params = { q?: string; kind?: string; category?: string; start?: string; end?: string };

async function TransactionsContent({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;

  const recurring = getRecurringNames();
  const settings = getSettings();

  let transactions = getTransactions().filter(
    (transaction) => {
      if (
        params.kind === "income" ||
        params.kind === "expense"
      ) {
        if (transaction.kind !== params.kind) {
          return false;
        }
      }

      if (
        params.category &&
        ALL_CATEGORIES.some(
          (category) =>
            category === params.category,
        ) &&
        transaction.category !== params.category
      ) {
        return false;
      }

      if (
        /^\d{4}-\d{2}-\d{2}$/.test(
          params.start ?? "",
        ) &&
        transaction.transaction_date <
          params.start!
      ) {
        return false;
      }

      if (
        /^\d{4}-\d{2}-\d{2}$/.test(
          params.end ?? "",
        ) &&
        transaction.transaction_date >
          params.end!
      ) {
        return false;
      }

      return true;
    },
  );

  const needle =
    params.q?.trim().toLocaleLowerCase();

  if (needle) {
    transactions = transactions.filter(
      (transaction) =>
        [
          transaction.merchant,
          transaction.description,
          transaction.notes,
          transaction.category,
        ].some((field) =>
          field
            ?.toLocaleLowerCase()
            .includes(needle),
        ),
    );
  }

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Cash activity" title="Transactions" description="Search, filter, edit, and review every income and expense entry." action={<AddTransactionButton />} />
      <form className="finance-card grid gap-3 p-4 md:grid-cols-[minmax(180px,1fr)_140px_170px_145px_145px_auto]" method="get">
        <label className="relative"><span className="sr-only">Search transactions</span><Search className="absolute left-3.5 top-3.5 size-4 text-slate-400" /><input className="field-input pl-10" name="q" placeholder="Search merchant or notes" defaultValue={params.q} /></label>
        <label><span className="sr-only">Type</span><select className="field-input" name="kind" defaultValue={params.kind ?? ""}><option value="">All types</option><option value="expense">Expenses</option><option value="income">Income</option></select></label>
        <label><span className="sr-only">Category</span><select className="field-input" name="category" defaultValue={params.category ?? ""}><option value="">All categories</option>{ALL_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
        <label><span className="sr-only">Start date</span><input className="field-input" type="date" name="start" defaultValue={params.start} /></label>
        <label><span className="sr-only">End date</span><input className="field-input" type="date" name="end" defaultValue={params.end} /></label>
        <button className="secondary-button"><Filter className="size-4" />Filter</button>
      </form>
      <p className="px-1 text-sm font-semibold text-slate-500">{transactions.length} transaction{transactions.length === 1 ? "" : "s"} · newest first</p>
      <TransactionList transactions={transactions} recurring={recurring} currency={settings?.currency ?? "USD"} />
    </div>
  );
}

export default function TransactionsPage({ searchParams }: { searchParams: Promise<Params> }) {
  return <Suspense fallback={<div className="h-96 animate-pulse rounded-[22px] bg-white" />}><TransactionsContent searchParams={searchParams} /></Suspense>;
}
