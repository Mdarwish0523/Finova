"use server";

import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import {
  recurringExpenses,
  recurringPayments,
  settings,
  transactions,
} from "@/lib/db/schema";
import { amountStringToCents } from "@/lib/finance/format";
import {
  recurringExpenseSchema,
  settingsSchema,
  transactionSchema,
} from "@/lib/finance/validation";

export type ActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

function value(formData: FormData, name: string) {
  return String(formData.get(name) ?? "");
}

function safeError(error: unknown, fallback: string) {
  console.error(fallback, error);

  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? fallback;
  }

  return fallback;
}

function refreshFinancePages() {
  revalidatePath("/protected");
  revalidatePath("/protected/transactions");
  revalidatePath("/protected/recurring");
  revalidatePath("/protected/reports");
}

export async function saveTransaction(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const parsed = transactionSchema.parse({
      id: value(formData, "id") || undefined,
      kind: value(formData, "kind"),
      amount: value(formData, "amount"),
      transactionDate: value(formData, "transactionDate"),
      category: value(formData, "category"),
      merchant: value(formData, "merchant"),
      description: value(formData, "description"),
      notes: value(formData, "notes"),
      recurringExpenseId: value(formData, "recurringExpenseId"),
    });

    const payload = {
      kind: parsed.kind,
      amount_cents: amountStringToCents(parsed.amount)!,
      transaction_date: parsed.transactionDate,
      category: parsed.category,
      merchant: parsed.merchant,
      description: parsed.description,
      notes: parsed.notes,
      recurring_expense_id:
        parsed.kind === "expense"
          ? parsed.recurringExpenseId
          : null,
      updated_at: new Date().toISOString(),
    };

    if (parsed.id) {
      db.update(transactions)
        .set(payload)
        .where(eq(transactions.id, parsed.id))
        .run();
    } else {
      db.insert(transactions)
        .values({
          id: randomUUID(),
          ...payload,
        })
        .run();
    }

    refreshFinancePages();

    return {
      ok: true,
      message: parsed.id
        ? "Transaction updated"
        : "Transaction added",
    };
  } catch (error) {
    return {
      ok: false,
      message: safeError(error, "Unable to save transaction"),
    };
  }
}

export async function deleteTransaction(
  id: string,
): Promise<ActionResult> {
  try {
    const transactionId = z.string().uuid().parse(id);

    db.delete(transactions)
      .where(eq(transactions.id, transactionId))
      .run();

    refreshFinancePages();

    return {
      ok: true,
      message: "Transaction deleted",
    };
  } catch (error) {
    return {
      ok: false,
      message: safeError(error, "Unable to delete transaction"),
    };
  }
}

export async function saveRecurringExpense(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const parsed = recurringExpenseSchema.parse({
      id: value(formData, "id") || undefined,
      name: value(formData, "name"),
      amount: value(formData, "amount"),
      category: value(formData, "category"),
      dueDay: value(formData, "dueDay"),
      active: value(formData, "active") !== "false",
      notes: value(formData, "notes"),
    });

    const payload = {
      name: parsed.name,
      amount_cents: amountStringToCents(parsed.amount)!,
      category: parsed.category,
      due_day: parsed.dueDay,
      active: parsed.active,
      notes: parsed.notes,
      updated_at: new Date().toISOString(),
    };

    if (parsed.id) {
      db.update(recurringExpenses)
        .set(payload)
        .where(eq(recurringExpenses.id, parsed.id))
        .run();
    } else {
      db.insert(recurringExpenses)
        .values({
          id: randomUUID(),
          ...payload,
        })
        .run();
    }

    refreshFinancePages();

    return {
      ok: true,
      message: parsed.id
        ? "Recurring bill updated"
        : "Recurring bill added",
    };
  } catch (error) {
    return {
      ok: false,
      message: safeError(error, "Unable to save recurring bill"),
    };
  }
}

export async function toggleRecurringExpense(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  try {
    const expenseId = z.string().uuid().parse(id);

    db.update(recurringExpenses)
      .set({
        active,
        updated_at: new Date().toISOString(),
      })
      .where(eq(recurringExpenses.id, expenseId))
      .run();

    refreshFinancePages();

    return {
      ok: true,
      message: active
        ? "Recurring bill activated"
        : "Recurring bill paused",
    };
  } catch (error) {
    return {
      ok: false,
      message: safeError(error, "Unable to update recurring bill"),
    };
  }
}

export async function deleteRecurringExpense(
  id: string,
): Promise<ActionResult> {
  try {
    const expenseId = z.string().uuid().parse(id);

    db.delete(recurringExpenses)
      .where(eq(recurringExpenses.id, expenseId))
      .run();

    refreshFinancePages();

    return {
      ok: true,
      message: "Recurring bill deleted",
    };
  } catch (error) {
    return {
      ok: false,
      message: safeError(error, "Unable to delete recurring bill"),
    };
  }
}

export async function markRecurringPaid(
  id: string,
  periodStart: string,
  paidDate: string,
): Promise<ActionResult> {
  try {
    const input = z
      .object({
        id: z.string().uuid(),
        periodStart: z.iso.date(),
        paidDate: z.iso.date(),
      })
      .parse({
        id,
        periodStart,
        paidDate,
      });

    if (!input.periodStart.endsWith("-01")) {
      throw new Error(
        "Recurring payment period must begin on the first day of a month",
      );
    }

    db.transaction((tx) => {
      const existing = tx
        .select({
          transaction_id:
            recurringPayments.transaction_id,
        })
        .from(recurringPayments)
        .where(
          and(
            eq(
              recurringPayments.recurring_expense_id,
              input.id,
            ),
            eq(
              recurringPayments.period_start,
              input.periodStart,
            ),
          ),
        )
        .limit(1)
        .get();

      if (existing) {
        return existing.transaction_id;
      }

      const expense = tx
        .select()
        .from(recurringExpenses)
        .where(
          and(
            eq(recurringExpenses.id, input.id),
            eq(recurringExpenses.active, true),
          ),
        )
        .limit(1)
        .get();

      if (!expense) {
        throw new Error(
          "Active recurring expense not found",
        );
      }

      const transactionId = randomUUID();

      tx.insert(transactions)
        .values({
          id: transactionId,
          kind: "expense",
          amount_cents: expense.amount_cents,
          transaction_date: input.paidDate,
          category: expense.category,
          merchant: expense.name,
          description: "Recurring payment",
          notes: expense.notes,
          recurring_expense_id: expense.id,
          updated_at: new Date().toISOString(),
        })
        .run();

      tx.insert(recurringPayments)
        .values({
          id: randomUUID(),
          recurring_expense_id: expense.id,
          period_start: input.periodStart,
          paid_date: input.paidDate,
          transaction_id: transactionId,
        })
        .run();

      return transactionId;
    });

    refreshFinancePages();

    return {
      ok: true,
      message: "Bill marked paid and transaction created",
    };
  } catch (error) {
    return {
      ok: false,
      message: safeError(error, "Unable to mark bill paid"),
    };
  }
}

export async function saveSettings(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const parsed = settingsSchema.parse({
      startingBalance: value(formData, "startingBalance"),
      monthlyBudget: value(formData, "monthlyBudget"),
      currency: value(formData, "currency"),
      timezone: value(formData, "timezone"),
    });

    const payload = {
      starting_balance_cents:
        amountStringToCents(parsed.startingBalance)!,
      monthly_budget_cents: parsed.monthlyBudget
        ? amountStringToCents(parsed.monthlyBudget)
        : null,
      currency: parsed.currency,
      timezone: parsed.timezone,
      updated_at: new Date().toISOString(),
    };

    db.insert(settings)
      .values({
        id: 1,
        ...payload,
      })
      .onConflictDoUpdate({
        target: settings.id,
        set: payload,
      })
      .run();

    revalidatePath("/protected", "layout");

    return {
      ok: true,
      message: "Settings saved",
    };
  } catch (error) {
    return {
      ok: false,
      message: safeError(error, "Unable to save settings"),
    };
  }
}
