import { connection } from "next/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/finance/page-header";
import { RecurringManager } from "@/components/finance/recurring-manager";
import {
  getRecurringExpenses,
  getRecurringPayments,
  getSettings,
} from "@/lib/db/queries";
import { dateInTimeZone, startOfMonth } from "@/lib/finance/dates";

export const metadata = { title: "Recurring" };

async function RecurringContent() {
  await connection();
  const settings = getSettings();
  const bills = getRecurringExpenses();
  const payments = getRecurringPayments();

  const today = dateInTimeZone(
    new Date(),
    settings?.timezone ?? "America/New_York",
  );

  const periodStart = startOfMonth(today);

  const paid = new Set(
    payments
      .filter(
        (item) =>
          item.period_start === periodStart,
      )
      .map(
        (item) =>
          item.recurring_expense_id,
      ),
  );

  const items = bills.map((bill) => ({
    ...bill,
    paid: paid.has(bill.id),
    status: (
      !bill.active
        ? "inactive"
        : paid.has(bill.id)
          ? "paid"
          : bill.due_day <
              Number(today.slice(8, 10))
            ? "overdue"
            : "upcoming"
    ) as
      | "paid"
      | "overdue"
      | "upcoming"
      | "inactive",
  }));
  return <div className="space-y-7"><PageHeader eyebrow="Monthly commitments" title="Recurring expenses" description="Manage predictable bills and record each payment exactly once per month." /><RecurringManager bills={items} currency={settings?.currency ?? "USD"} periodStart={periodStart} today={today} /></div>;
}

export default function RecurringPage() {
  return <Suspense fallback={<div className="h-96 animate-pulse rounded-[22px] bg-white" />}><RecurringContent /></Suspense>;
}
