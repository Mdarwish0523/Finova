import { connection } from "next/server";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Banknote, CalendarClock, CircleDollarSign, CreditCard, Hourglass, Landmark, Scale, Sparkles, TrendingDown } from "lucide-react";
import {
  getActiveFreeTrials,
  getActiveRecurringExpenses,
  getLatestAiReport,
  getRecurringPayments,
  getSettings,
  getTransactions,
} from "@/lib/db/queries";
import { calculateMetrics, sumByKind, type Transaction } from "@/lib/finance/calculations";
import { dateInTimeZone, endOfMonth, rangeForPeriod, shiftDate, startOfMonth, startOfWeek } from "@/lib/finance/dates";
import { formatCurrency, formatDate, percentChange } from "@/lib/finance/format";
import { AddTransactionButton } from "@/components/finance/transaction-dialog";
import { CategoryChart, TrendChart } from "@/components/finance/charts";
import { PageHeader, SectionHeading } from "@/components/finance/page-header";
import { StatCard } from "@/components/finance/stat-card";

function summaryFromAnalysis(analysis: unknown) {
  if (
    analysis &&
    typeof analysis === "object" &&
    !Array.isArray(analysis) &&
    "summary" in analysis &&
    typeof analysis.summary === "string"
  ) {
    return analysis.summary;
  }

  return null;
}

export default async function DashboardContent() {
  await connection();
  const settings = getSettings();
  const transactions = getTransactions() as Transaction[];
  const recurring = getActiveRecurringExpenses();
  const payments = getRecurringPayments();
  const latest = getLatestAiReport();
  const freeTrials = getActiveFreeTrials();

  const currency = settings?.currency ?? "USD";
  const timezone = settings?.timezone ?? process.env.APP_TIMEZONE ?? "America/New_York";
  const today = dateInTimeZone(new Date(), timezone);
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const previousMonth = rangeForPeriod("monthly", shiftDate(monthStart, -1));
  const monthMetrics = calculateMetrics(transactions, monthStart, monthEnd);
  const previousMetrics = calculateMetrics(transactions, previousMonth.start, previousMonth.end);
  const todayMetrics = calculateMetrics(transactions, today, today);
  const weekMetrics = calculateMetrics(transactions, startOfWeek(today), today);
  const balance = Number(settings?.starting_balance_cents ?? 0) + sumByKind(transactions, "income") - sumByKind(transactions, "expense");
  const recurringTotal = recurring.reduce((sum, item) => sum + Number(item.amount_cents), 0);
  const change = percentChange(monthMetrics.expenseCents, previousMetrics.expenseCents);
  const paidSet = new Set(payments.filter((payment) => payment.period_start === monthStart).map((payment) => payment.recurring_expense_id));
  const recent = transactions.slice(0, 6);
  const upcomingTrials = freeTrials.filter((trial) => trial.charge_date >= today && trial.charge_date <= shiftDate(today, 7));

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Financial overview"
        title="Good to see you"
        description={`${formatDate(today, { weekday: "long", month: "long", day: "numeric", year: "numeric" })} · Your money at a glance.`}
        action={<AddTransactionButton className="hidden sm:inline-flex" />}
      />

      <section className="overflow-hidden rounded-[26px] bg-gradient-to-br from-[#163994] via-[#2855d9] to-[#3975f2] p-6 text-white shadow-2xl shadow-blue-200 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-100">Current balance</p>
            <p className="mt-2 text-4xl font-extrabold tracking-[-0.045em] sm:text-5xl">{formatCurrency(balance, currency)}</p>
            <p className="mt-3 text-sm text-blue-100/80">Starting balance plus all recorded income, less all expenses.</p>
          </div>
          <div className={`flex w-fit items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold ${monthMetrics.netCents >= 0 ? "bg-white/15 text-emerald-100" : "bg-rose-400/20 text-rose-100"}`}>
            {monthMetrics.netCents >= 0 ? <ArrowUpRight className="size-5" /> : <ArrowDownRight className="size-5" />}
            {formatCurrency(monthMetrics.netCents, currency)} this month
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Income today" value={formatCurrency(todayMetrics.incomeCents, currency)} detail="Recorded today" icon={ArrowUpRight} tone="green" />
        <StatCard label="Spending today" value={formatCurrency(todayMetrics.expenseCents, currency)} detail="Recorded today" icon={ArrowDownRight} tone="red" />
        <StatCard label="Spending this week" value={formatCurrency(weekMetrics.expenseCents, currency)} detail={`Since ${formatDate(startOfWeek(today), { month: "short", day: "numeric" })}`} icon={TrendingDown} tone="red" />
        <StatCard label="Spending this month" value={formatCurrency(monthMetrics.expenseCents, currency)} detail={change === null ? "No previous-period baseline" : `${Math.abs(change).toFixed(1)}% ${change <= 0 ? "less" : "more"} than last month`} icon={CreditCard} tone="blue" />
        <StatCard label="Income this month" value={formatCurrency(monthMetrics.incomeCents, currency)} detail="All recorded income" icon={Banknote} tone="green" />
        <StatCard label="Net cash flow" value={formatCurrency(monthMetrics.netCents, currency)} detail="Income minus spending" icon={Scale} tone={monthMetrics.netCents >= 0 ? "green" : "red"} />
        <StatCard label="Monthly recurring" value={formatCurrency(recurringTotal, currency)} detail={`${recurring.length} active bills`} icon={CalendarClock} tone="navy" />
        <StatCard label="Monthly budget" value={settings?.monthly_budget_cents == null ? "Not set" : formatCurrency(Number(settings.monthly_budget_cents), currency)} detail={settings?.monthly_budget_cents ? `${Math.max(0, 100 - (monthMetrics.expenseCents / Number(settings.monthly_budget_cents)) * 100).toFixed(0)}% remaining` : "Set a target in Settings"} icon={Landmark} tone="blue" />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="finance-card p-5 sm:p-6">
          <SectionHeading title="Spending by category" description="Where your money went this month" />
          <CategoryChart data={monthMetrics.byCategory} currency={currency} />
        </div>
        <div className="finance-card p-5 sm:p-6">
          <SectionHeading title="Daily spending trend" description="Expense activity across this month" />
          <TrendChart data={monthMetrics.overTime} currency={currency} />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <div className="finance-card overflow-hidden">
          <div className="p-5 sm:p-6"><SectionHeading title="Recent transactions" description="Your latest account activity" action={<Link href="/protected/transactions" className="text-sm font-bold text-blue-700">View all</Link>} /></div>
          {recent.length ? (
            <div className="divide-y divide-slate-100">
              {recent.map((transaction) => (
                <div key={transaction.id} className="flex items-center gap-3 px-5 py-4 sm:px-6">
                  <span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${transaction.kind === "income" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-700"}`}>
                    {transaction.kind === "income" ? <ArrowUpRight className="size-5" /> : <CircleDollarSign className="size-5" />}
                  </span>
                  <div className="min-w-0 flex-1"><p className="truncate font-bold text-slate-900">{transaction.merchant || transaction.description || transaction.category}</p><p className="mt-1 text-xs text-slate-400">{transaction.category} · {formatDate(transaction.transaction_date, { month: "short", day: "numeric" })}</p></div>
                  <p className={`shrink-0 font-extrabold tabular-nums ${transaction.kind === "income" ? "text-emerald-600" : "text-slate-900"}`}>{transaction.kind === "income" ? "+" : "−"}{formatCurrency(Number(transaction.amount_cents), currency)}</p>
                </div>
              ))}
            </div>
          ) : <div className="px-6 py-14 text-center text-sm text-slate-400">No transactions yet. Add your first one to bring the dashboard to life.</div>}
        </div>

        <div className="space-y-5">
          <div className="finance-card p-5 sm:p-6">
            <SectionHeading title="Upcoming trials" description="Expected charges in the next 7 days" action={<Link href="/protected/trials" className="text-sm font-bold text-blue-700">Manage</Link>} />
            <div className="mt-5 space-y-3">
              {upcomingTrials.slice(0, 5).map((trial) => {
                const days = Math.round((Date.parse(`${trial.charge_date}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 86_400_000);
                return <div key={trial.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3"><span className="grid size-10 place-items-center rounded-xl bg-white text-blue-700 shadow-sm"><Hourglass className="size-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-900">{trial.service_name}</p><p className="mt-0.5 truncate text-xs text-slate-400">{formatDate(trial.charge_date, { month: "short", day: "numeric" })} · {trial.card_label}</p></div><p className="shrink-0 text-xs font-bold text-amber-700">{days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days} days`}</p></div>;
              })}
              {!upcomingTrials.length ? <p className="py-7 text-center text-sm text-slate-400">No trial charges expected in the next 7 days.</p> : null}
            </div>
          </div>

          <div className="finance-card p-5 sm:p-6">
            <SectionHeading title="Upcoming bills" description="Active recurring expenses this month" action={<Link href="/protected/recurring" className="text-sm font-bold text-blue-700">Manage</Link>} />
            <div className="mt-5 space-y-3">
              {recurring.slice(0, 5).map((bill) => {
                const paid = paidSet.has(bill.id);
                const overdue = !paid && bill.due_day < Number(today.slice(8, 10));
                return <div key={bill.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3"><span className="grid size-10 place-items-center rounded-xl bg-white text-blue-700 shadow-sm"><CalendarClock className="size-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-900">{bill.name}</p><p className="mt-0.5 text-xs text-slate-400">Due day {bill.due_day}</p></div><div className="text-right"><p className="text-sm font-extrabold">{formatCurrency(Number(bill.amount_cents), currency)}</p><p className={`text-[10px] font-bold uppercase ${paid ? "text-emerald-600" : overdue ? "text-rose-600" : "text-amber-600"}`}>{paid ? "Paid" : overdue ? "Overdue" : "Upcoming"}</p></div></div>;
              })}
              {!recurring.length ? <p className="py-7 text-center text-sm text-slate-400">No recurring bills configured.</p> : null}
            </div>
          </div>

          <div className="overflow-hidden rounded-[22px] bg-gradient-to-br from-[#101b3a] to-[#1c3474] p-6 text-white shadow-xl shadow-blue-100">
            <div className="flex items-center gap-2 text-blue-200"><Sparkles className="size-5" /><p className="text-xs font-bold uppercase tracking-[0.16em]">Latest AI insight</p></div>
            <p className="mt-4 text-sm leading-6 text-blue-50/90">{latest ? summaryFromAnalysis(latest.analysis) ?? "Your latest analysis is ready in Reports." : "Generate a daily, weekly, or monthly analysis from Reports when you want a focused budgeting review."}</p>
            <Link href="/protected/reports" className="mt-5 inline-flex text-sm font-bold text-white underline decoration-blue-300 underline-offset-4">Open reports</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
