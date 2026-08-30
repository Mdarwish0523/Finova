"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOwnerForAction } from "@/lib/auth";
import { completedPeriodRange, dateInTimeZone } from "@/lib/finance/dates";
import { generateFinanceReport } from "@/lib/ai/finance-report";

export async function generateAnalysis(period: "daily" | "weekly" | "monthly") {
  const parsedPeriod = z.enum(["daily", "weekly", "monthly"]).parse(period);
  const { userId, supabase } = await requireOwnerForAction();
  const { data: settings } = await supabase.from("user_settings").select("timezone").eq("user_id", userId).maybeSingle();
  const today = dateInTimeZone(new Date(), settings?.timezone ?? process.env.APP_TIMEZONE ?? "America/New_York");
  const result = await generateFinanceReport({ supabase, userId, periodType: parsedPeriod, range: completedPeriodRange(parsedPeriod, today) });
  if (result.ok) revalidatePath("/protected/reports");
  return { ok: result.ok, message: result.message };
}
