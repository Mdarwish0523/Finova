import {
  and,
  asc,
  desc,
  eq,
  gte,
  lte,
} from "drizzle-orm";

import { db } from "@/lib/db";
import {
  aiReports,
  freeTrials,
  recurringExpenses,
  recurringPayments,
  settings,
  transactions,
} from "@/lib/db/schema";

export function getSettings() {
  return db
    .select()
    .from(settings)
    .where(eq(settings.id, 1))
    .limit(1)
    .all()[0];
}

export function getTransactions() {
  return db
    .select()
    .from(transactions)
    .orderBy(
      desc(transactions.transaction_date),
      desc(transactions.created_at),
    )
    .all();
}

export function getTransactionsForRange(
  start: string,
  end: string,
) {
  return db
    .select()
    .from(transactions)
    .where(
      and(
        gte(transactions.transaction_date, start),
        lte(transactions.transaction_date, end),
      ),
    )
    .orderBy(asc(transactions.transaction_date))
    .all();
}

export function getRecurringExpenses() {
  return db
    .select()
    .from(recurringExpenses)
    .orderBy(
      desc(recurringExpenses.active),
      asc(recurringExpenses.due_day),
    )
    .all();
}

export function getActiveRecurringExpenses() {
  return db
    .select()
    .from(recurringExpenses)
    .where(eq(recurringExpenses.active, true))
    .orderBy(asc(recurringExpenses.due_day))
    .all();
}

export function getRecurringNames() {
  return db
    .select({
      id: recurringExpenses.id,
      name: recurringExpenses.name,
    })
    .from(recurringExpenses)
    .orderBy(asc(recurringExpenses.name))
    .all();
}

export function getRecurringPayments() {
  return db
    .select({
      recurring_expense_id:
        recurringPayments.recurring_expense_id,
      period_start: recurringPayments.period_start,
    })
    .from(recurringPayments)
    .all();
}

export function getLatestAiReport() {
  return db
    .select()
    .from(aiReports)
    .orderBy(desc(aiReports.generated_at))
    .limit(1)
    .all()[0];
}

export function getAiReportHistory(limit = 12) {
  return db
    .select()
    .from(aiReports)
    .orderBy(desc(aiReports.generated_at))
    .limit(limit)
    .all();
}

export function getActiveFreeTrials() {
  return db
    .select()
    .from(freeTrials)
    .where(eq(freeTrials.status, "active"))
    .orderBy(asc(freeTrials.charge_date))
    .all();
}
