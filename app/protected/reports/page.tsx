import { connection } from "next/server";
import Link from "next/link";
import { Suspense } from "react";
import { Activity, ArrowDownRight, ArrowUpRight, CalendarDays, CircleDollarSign, Hash, ReceiptText, Scale } from "lucide-react";
import { getSettings, getTransactionsForRange } from "@/lib/db/queries";
import { calculateMetrics } from "@/lib/finance/calculations";
import { customRange, dateInTimeZone, rangeForPeriod, type PeriodType } from "@/lib/finance/dates";
import { formatCurrency, formatDate, percentChange } from "@/lib/finance/format";
import { PageHeader, SectionHeading } from "@/components/finance/page-header";
import { StatCard } from "@/components/finance/stat-card";
import { CategoryChart, TrendChart } from "@/components/finance/charts";

export const metadata = { title: "Reports" };
type Params = { period?: string; anchor?: string; start?: string; end?: string };

async function ReportsContent({ searchParams }: { searchParams: Promise<Params> }) {
  await connection();

  const params = await searchParams;
  const settings = getSettings();
  const today = dateInTimeZone(new Date(), settings?.timezone ?? "America/New_York");
  const period = (["daily", "weekly", "monthly", "custom"].includes(params.period ?? "") ? params.period : "monthly") as PeriodType | "custom";
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const anchor = datePattern.test(params.anchor ?? "") ? params.anchor! : today;
  const range = period === "custom" && datePattern.test(params.start ?? "") && datePattern.test(params.end ?? "") && params.start! <= params.end!
    ? customRange(params.start!, params.end!)
    : rangeForPeriod(period === "custom" ? "monthly" : period, anchor);

  const transactions = getTransactionsForRange(range.previousStart, range.end);
  const currency = settings?.currency ?? "USD";
  const metrics = calculateMetrics(transactions, range.start, range.end);
  const previous = calculateMetrics(transactions, range.previousStart, range.previousEnd);
  const spendingChange = percentChange(metrics.expenseCents, previous.expenseCents);

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Trends and totals" title="Reports" description="Review income, spending, cash flow, categories, and trends for any period." />
      <div className="finance-card p-4">
        <div className="flex flex-wrap gap-2">
          {(["daily", "weekly", "monthly", "custom"] as const).map((item) => <Link key={item} href={`/protected/reports?period=${item}`} className={`rounded-xl px-4 py-2 text-sm font-bold capitalize transition ${period === item ? "bg-blue-700 text-white" : "bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-700"}`}>{item}</Link>)}
        </div>
        <form className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-[1fr_1fr_auto]" method="get">
          <input type="hidden" name="period" value={period} />
          {period === "custom" ? <><label className="field-label">Start<input className="field-input mt-2" type="date" name="start" defaultValue={range.start} /></label><label className="field-label">End<input className="field-input mt-2" type="date" name="end" defaultValue={range.end} /></label></> : <label className="field-label sm:col-span-2">Period containing<input className="field-input mt-2" type="date" name="anchor" defaultValue={anchor} /></label>}
          <button className="secondary-button self-end"><CalendarDays className="size-4" />Apply</button>
        </form>
      </div>

      <div>
        <p className="text-sm font-bold text-slate-900">{formatDate(range.start)} — {formatDate(range.end)}</p>
        <p className="mt-1 text-xs text-slate-400">Compared with {formatDate(range.previousStart)} — {formatDate(range.previousEnd)}</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Income" value={formatCurrency(metrics.incomeCents, currency)} detail="In selected period" icon={ArrowUpRight} tone="green" />
        <StatCard label="Expenses" value={formatCurrency(metrics.expenseCents, currency)} detail={spendingChange === null ? "No comparison baseline" : `${Math.abs(spendingChange).toFixed(1)}% ${spendingChange <= 0 ? "lower" : "higher"} than previous`} icon={ArrowDownRight} tone="red" />
        <StatCard label="Net cash flow" value={formatCurrency(metrics.netCents, currency)} detail="Income minus expenses" icon={Scale} tone={metrics.netCents >= 0 ? "green" : "red"} />
        <StatCard label="Transactions" value={String(metrics.transactionCount)} detail="Income and expense entries" icon={Hash} tone="navy" />
        <StatCard label="Average daily spend" value={formatCurrency(metrics.averageDailySpendingCents, currency)} detail="Across every calendar day" icon={Activity} tone="blue" />
        <StatCard label="Largest expense" value={metrics.largestExpense ? formatCurrency(metrics.largestExpense.amountCents, currency) : "—"} detail={metrics.largestExpense ? `${metrics.largestExpense.category} · ${formatDate(metrics.largestExpense.date, { month: "short", day: "numeric" })}` : "No expenses"} icon={CircleDollarSign} tone="red" />
        <StatCard label="Recurring spend" value={formatCurrency(metrics.recurringExpenseCents, currency)} detail="Linked recurring payments" icon={ReceiptText} tone="navy" />
        <StatCard label="Discretionary spend" value={formatCurrency(metrics.discretionaryExpenseCents, currency)} detail="Expenses not linked to a recurring bill" icon={CircleDollarSign} tone="blue" />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="finance-card p-5 sm:p-6"><SectionHeading title="Spending by category" description="Selected period" /><CategoryChart data={metrics.byCategory} currency={currency} /></div>
        <div className="finance-card p-5 sm:p-6"><SectionHeading title="Spending over time" description="Daily expense totals" /><TrendChart data={metrics.overTime} currency={currency} /></div>
      </section>
    </div>
  );
}

export default function ReportsPage({ searchParams }: { searchParams: Promise<Params> }) {
  return <Suspense fallback={<div className="h-96 animate-pulse rounded-[22px] bg-white" />}><ReportsContent searchParams={searchParams} /></Suspense>;
}
