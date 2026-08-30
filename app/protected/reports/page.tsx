import Link from "next/link";
import { Suspense } from "react";
import { Activity, ArrowDownRight, ArrowUpRight, CalendarDays, CircleDollarSign, Hash, ReceiptText, Scale, Sparkles } from "lucide-react";
import { requireOwner } from "@/lib/auth";
import { calculateMetrics } from "@/lib/finance/calculations";
import { customRange, dateInTimeZone, rangeForPeriod, type PeriodType } from "@/lib/finance/dates";
import { formatCurrency, formatDate, percentChange } from "@/lib/finance/format";
import { financeAnalysisSchema } from "@/lib/ai/finance-report";
import { PageHeader, SectionHeading } from "@/components/finance/page-header";
import { StatCard } from "@/components/finance/stat-card";
import { CategoryChart, TrendChart } from "@/components/finance/charts";
import { AnalysisButtons } from "@/components/finance/analysis-buttons";

export const metadata = { title: "Reports" };
type Params = { period?: string; anchor?: string; start?: string; end?: string };

async function ReportsContent({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const { userId, supabase } = await requireOwner();
  const { data: settings } = await supabase.from("user_settings").select("currency, timezone").eq("user_id", userId).maybeSingle();
  const today = dateInTimeZone(new Date(), settings?.timezone ?? "America/New_York");
  const period = (["daily", "weekly", "monthly", "custom"].includes(params.period ?? "") ? params.period : "monthly") as PeriodType | "custom";
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const anchor = datePattern.test(params.anchor ?? "") ? params.anchor! : today;
  const range = period === "custom" && datePattern.test(params.start ?? "") && datePattern.test(params.end ?? "") && params.start! <= params.end!
    ? customRange(params.start!, params.end!)
    : rangeForPeriod(period === "custom" ? "monthly" : period, anchor);

  const [{ data: transactions, error }, { data: history }] = await Promise.all([
    supabase.from("transactions").select("*").eq("user_id", userId).gte("transaction_date", range.previousStart).lte("transaction_date", range.end).order("transaction_date"),
    supabase.from("ai_reports").select("*").eq("user_id", userId).order("generated_at", { ascending: false }).limit(12),
  ]);
  if (error) throw new Error("Unable to load reports");
  const currency = settings?.currency ?? "USD";
  const metrics = calculateMetrics(transactions ?? [], range.start, range.end);
  const previous = calculateMetrics(transactions ?? [], range.previousStart, range.previousEnd);
  const spendingChange = percentChange(metrics.expenseCents, previous.expenseCents);

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Trends and guidance" title="Reports" description="Explore deterministic totals and optional AI-powered observations across any period." />
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-bold text-slate-900">{formatDate(range.start)} — {formatDate(range.end)}</p><p className="mt-1 text-xs text-slate-400">Compared with {formatDate(range.previousStart)} — {formatDate(range.previousEnd)}</p></div>
        <AnalysisButtons />
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

      <section className="grid gap-5 xl:grid-cols-2"><div className="finance-card p-5 sm:p-6"><SectionHeading title="Spending by category" description="Selected period" /><CategoryChart data={metrics.byCategory} currency={currency} /></div><div className="finance-card p-5 sm:p-6"><SectionHeading title="Spending over time" description="Daily expense totals" /><TrendChart data={metrics.overTime} currency={currency} /></div></section>

      <section className="finance-card p-5 sm:p-6">
        <SectionHeading title="AI analysis history" description="Saved structured guidance; calculations above always come from application code" />
        <div className="mt-6 space-y-4">
          {(history ?? []).map((report) => {
            const parsed = financeAnalysisSchema.safeParse(report.analysis);
            if (!parsed.success) return null;
            const analysis = parsed.data;
            return <article key={report.id} className="rounded-[20px] border border-blue-100 bg-blue-50/40 p-5"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2"><Sparkles className="size-4 text-blue-700" /><h3 className="font-extrabold capitalize text-slate-950">{report.period_type} analysis</h3></div><p className="text-xs font-semibold text-slate-400">{formatDate(report.period_start)} — {formatDate(report.period_end)}</p></div><p className="mt-4 text-sm leading-6 text-slate-600">{analysis.summary}</p><div className="mt-4 grid gap-4 md:grid-cols-2"><div><p className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">Positive patterns</p><ul className="mt-2 space-y-1 text-sm text-slate-600">{analysis.positive_patterns.map((item) => <li key={item}>• {item}</li>)}</ul></div><div><p className="text-xs font-extrabold uppercase tracking-wider text-blue-700">Next actions</p><ol className="mt-2 space-y-1 text-sm text-slate-600">{analysis.next_actions.map((item, index) => <li key={item}>{index + 1}. {item}</li>)}</ol></div></div><p className="mt-4 border-t border-blue-100 pt-3 text-[11px] leading-5 text-slate-400">{analysis.disclaimer}</p></article>;
          })}
          {!history?.length ? <div className="py-12 text-center"><Sparkles className="mx-auto size-7 text-blue-600" /><p className="mt-3 text-sm font-semibold text-slate-500">No AI analyses generated yet.</p><p className="mt-1 text-xs text-slate-400">Use one of the buttons above. Reports continue working when AI is unavailable.</p></div> : null}
        </div>
      </section>
    </div>
  );
}

export default function ReportsPage({ searchParams }: { searchParams: Promise<Params> }) {
  return <Suspense fallback={<div className="h-96 animate-pulse rounded-[22px] bg-white" />}><ReportsContent searchParams={searchParams} /></Suspense>;
}
