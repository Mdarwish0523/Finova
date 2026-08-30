import { Suspense } from "react";
import { PageHeader } from "@/components/finance/page-header";
import { RecurringManager } from "@/components/finance/recurring-manager";
import { requireOwner } from "@/lib/auth";
import { dateInTimeZone, startOfMonth } from "@/lib/finance/dates";

export const metadata = { title: "Recurring" };

async function RecurringContent() {
  const { userId, supabase } = await requireOwner();
  const [{ data: settings }, { data: bills, error }, { data: payments }] = await Promise.all([
    supabase.from("user_settings").select("currency, timezone").eq("user_id", userId).maybeSingle(),
    supabase.from("recurring_expenses").select("*").eq("user_id", userId).order("active", { ascending: false }).order("due_day"),
    supabase.from("recurring_payments").select("recurring_expense_id, period_start").eq("user_id", userId),
  ]);
  if (error) throw new Error("Unable to load recurring bills");
  const today = dateInTimeZone(new Date(), settings?.timezone ?? "America/New_York");
  const periodStart = startOfMonth(today);
  const paid = new Set((payments ?? []).filter((item) => item.period_start === periodStart).map((item) => item.recurring_expense_id));
  const items = (bills ?? []).map((bill) => ({
    ...bill,
    paid: paid.has(bill.id),
    status: (!bill.active ? "inactive" : paid.has(bill.id) ? "paid" : bill.due_day < Number(today.slice(8, 10)) ? "overdue" : "upcoming") as "paid" | "overdue" | "upcoming" | "inactive",
  }));
  return <div className="space-y-7"><PageHeader eyebrow="Monthly commitments" title="Recurring expenses" description="Manage predictable bills and record each payment exactly once per month." /><RecurringManager bills={items} currency={settings?.currency ?? "USD"} periodStart={periodStart} today={today} /></div>;
}

export default function RecurringPage() {
  return <Suspense fallback={<div className="h-96 animate-pulse rounded-[22px] bg-white" />}><RecurringContent /></Suspense>;
}
