import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/database.types";
import { calculateMetrics } from "@/lib/finance/calculations";
import type { DateRange, PeriodType } from "@/lib/finance/dates";

export const FINANCE_DISCLAIMER =
  "This is general budgeting guidance, not professional financial, tax, legal, or investment advice.";

export const financeAnalysisSchema = z.object({
  summary: z.string().min(1).max(600),
  positive_patterns: z.array(z.string().min(1).max(300)).max(5),
  areas_of_concern: z.array(z.string().min(1).max(300)).max(5),
  unusual_changes: z.array(z.string().min(1).max(300)).max(5),
  spending_observations: z.array(z.string().min(1).max(300)).max(6),
  next_actions: z.array(z.string().min(1).max(300)).length(3),
  disclaimer: z.literal(FINANCE_DISCLAIMER),
});

export type FinanceAnalysis = z.infer<typeof financeAnalysisSchema>;

export type GenerateResult =
  | { ok: true; status: "generated" | "existing"; message: string; analysis: FinanceAnalysis }
  | { ok: false; status: "unavailable" | "error"; message: string };

export async function generateFinanceReport({
  supabase,
  userId,
  periodType,
  range,
  skipExisting = false,
}: {
  supabase: SupabaseClient<Database>;
  userId: string;
  periodType: PeriodType;
  range: DateRange;
  skipExisting?: boolean;
}): Promise<GenerateResult> {
  const { data: existing } = await supabase
    .from("ai_reports")
    .select("analysis")
    .eq("user_id", userId)
    .eq("period_type", periodType)
    .eq("period_start", range.start)
    .eq("period_end", range.end)
    .maybeSingle();
  if (skipExisting && existing) {
    const parsed = financeAnalysisSchema.safeParse(existing.analysis);
    if (parsed.success) return { ok: true, status: "existing", message: "Report already exists", analysis: parsed.data };
  }

  if (!process.env.OPENAI_API_KEY) {
    return { ok: false, status: "unavailable", message: "AI analysis is unavailable because OPENAI_API_KEY is not configured." };
  }

  const [{ data: settings, error: settingsError }, { data: transactions, error: transactionError }] = await Promise.all([
    supabase.from("user_settings").select("currency, ai_analysis_enabled").eq("user_id", userId).maybeSingle(),
    supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .gte("transaction_date", range.previousStart)
      .lte("transaction_date", range.end)
      .order("transaction_date"),
  ]);
  if (settingsError || transactionError) {
    console.error("AI report data error", { settingsError, transactionError });
    return { ok: false, status: "error", message: "The financial metrics could not be loaded." };
  }
  if (settings && !settings.ai_analysis_enabled) {
    return { ok: false, status: "unavailable", message: "AI analysis is disabled in Settings." };
  }

  const current = calculateMetrics(transactions ?? [], range.start, range.end);
  const previous = calculateMetrics(transactions ?? [], range.previousStart, range.previousEnd);
  const aggregatedMetrics = {
    period: { type: periodType, start: range.start, end: range.end },
    currency: settings?.currency ?? "USD",
    current: {
      income_cents: current.incomeCents,
      expense_cents: current.expenseCents,
      net_cents: current.netCents,
      transaction_count: current.transactionCount,
      average_daily_spending_cents: current.averageDailySpendingCents,
      largest_expense: current.largestExpense
        ? { amount_cents: current.largestExpense.amountCents, category: current.largestExpense.category, date: current.largestExpense.date }
        : null,
      spending_by_category: current.byCategory.map((item) => ({ category: item.category, amount_cents: item.amountCents })),
      daily_totals: current.overTime.map((item) => ({ date: item.date, expense_cents: item.expenseCents, income_cents: item.incomeCents })),
      recurring_expense_cents: current.recurringExpenseCents,
      discretionary_expense_cents: current.discretionaryExpenseCents,
    },
    previous: {
      start: range.previousStart,
      end: range.previousEnd,
      income_cents: previous.incomeCents,
      expense_cents: previous.expenseCents,
      net_cents: previous.netCents,
      transaction_count: previous.transactionCount,
    },
  };

  try {
    const model = process.env.OPENAI_FINANCE_MODEL || "gpt-5-mini";
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.responses.parse({
      model,
      store: false,
      instructions: [
        "You are a concise personal budgeting analyst.",
        "Use only the supplied deterministic metrics. Never recalculate or invent totals.",
        "Do not provide investment, tax, legal, or professional financial advice.",
        "Write practical observations in plain language. If data is sparse, say so.",
      ].join(" "),
      input: JSON.stringify(aggregatedMetrics),
      text: {
        format: zodTextFormat(financeAnalysisSchema, "personal_finance_analysis"),
        verbosity: "low",
      },
    });
    const analysis = financeAnalysisSchema.parse(response.output_parsed);
    const { error } = await supabase.from("ai_reports").upsert(
      {
        user_id: userId,
        period_type: periodType,
        period_start: range.start,
        period_end: range.end,
        metrics: aggregatedMetrics as unknown as Json,
        analysis: analysis as unknown as Json,
        model,
        generated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,period_type,period_start,period_end" },
    );
    if (error) throw error;
    return { ok: true, status: "generated", message: `${periodType[0].toUpperCase()}${periodType.slice(1)} analysis generated`, analysis };
  } catch (error) {
    const status = error instanceof OpenAI.APIError ? error.status : undefined;
    console.error("AI report generation failed", { status, error: error instanceof Error ? error.message : "Unknown error" });
    return {
      ok: false,
      status: status === 429 ? "unavailable" : "error",
      message: status === 429 ? "AI is temporarily rate limited. Your finance data remains available." : "AI analysis could not be generated right now. Your finance data remains available.",
    };
  }
}
