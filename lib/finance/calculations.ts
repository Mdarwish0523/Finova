import type { transactions } from "@/lib/db/schema";
import { enumerateDates } from "@/lib/finance/dates";

export type Transaction = typeof transactions.$inferSelect;

export type FinancialMetrics = {
  incomeCents: number;
  expenseCents: number;
  netCents: number;
  transactionCount: number;
  averageDailySpendingCents: number;
  largestExpense: null | {
    amountCents: number;
    category: string;
    merchant: string | null;
    date: string;
  };
  byCategory: Array<{ category: string; amountCents: number }>;
  overTime: Array<{ date: string; expenseCents: number; incomeCents: number }>;
  recurringExpenseCents: number;
  discretionaryExpenseCents: number;
};

export function sumByKind(transactions: Transaction[], kind: "income" | "expense") {
  return transactions
    .filter((transaction) => transaction.kind === kind)
    .reduce((sum, transaction) => sum + Number(transaction.amount_cents), 0);
}

export function calculateMetrics(
  transactions: Transaction[],
  start: string,
  end: string,
): FinancialMetrics {
  const selected = transactions.filter(
    (transaction) =>
      transaction.transaction_date >= start && transaction.transaction_date <= end,
  );
  const expenses = selected.filter((transaction) => transaction.kind === "expense");
  const incomeCents = sumByKind(selected, "income");
  const expenseCents = sumByKind(selected, "expense");
  const categoryMap = new Map<string, number>();
  const dateMap = new Map<string, { expenseCents: number; incomeCents: number }>();

  for (const transaction of selected) {
    const current = dateMap.get(transaction.transaction_date) ?? {
      expenseCents: 0,
      incomeCents: 0,
    };
    current[transaction.kind === "expense" ? "expenseCents" : "incomeCents"] +=
      Number(transaction.amount_cents);
    dateMap.set(transaction.transaction_date, current);
    if (transaction.kind === "expense") {
      categoryMap.set(
        transaction.category,
        (categoryMap.get(transaction.category) ?? 0) + Number(transaction.amount_cents),
      );
    }
  }

  const recurringExpenseCents = expenses
    .filter((transaction) => transaction.recurring_expense_id)
    .reduce((sum, transaction) => sum + Number(transaction.amount_cents), 0);
  const largest = expenses.reduce<Transaction | null>(
    (current, transaction) =>
      !current || Number(transaction.amount_cents) > Number(current.amount_cents)
        ? transaction
        : current,
    null,
  );

  return {
    incomeCents,
    expenseCents,
    netCents: incomeCents - expenseCents,
    transactionCount: selected.length,
    averageDailySpendingCents: Math.round(
      expenseCents / Math.max(1, enumerateDates(start, end).length),
    ),
    largestExpense: largest
      ? {
          amountCents: Number(largest.amount_cents),
          category: largest.category,
          merchant: largest.merchant,
          date: largest.transaction_date,
        }
      : null,
    byCategory: [...categoryMap.entries()]
      .map(([category, amountCents]) => ({ category, amountCents }))
      .sort((a, b) => b.amountCents - a.amountCents),
    overTime: enumerateDates(start, end).map((date) => ({
      date,
      ...(dateMap.get(date) ?? { expenseCents: 0, incomeCents: 0 }),
    })),
    recurringExpenseCents,
    discretionaryExpenseCents: expenseCents - recurringExpenseCents,
  };
}
