import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dateInTimeZone, completedPeriodRange, type PeriodType } from "@/lib/finance/dates";
import { generateFinanceReport } from "@/lib/ai/finance-report";

export const maxDuration = 300;

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization");
  if (!secret || !header?.startsWith("Bearer ")) return false;
  const received = Buffer.from(header.slice(7));
  const expected = Buffer.from(secret);
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const userId = process.env.OWNER_USER_ID;
  if (!userId) return NextResponse.json({ ok: false, error: "OWNER_USER_ID is not configured" }, { status: 500 });
  try {
    const supabase = createAdminClient();
    const { data: settings, error } = await supabase.from("user_settings").select("*").eq("user_id", userId).maybeSingle();
    if (error) throw error;
    const timezone = process.env.APP_TIMEZONE || settings?.timezone || "America/New_York";
    const today = dateInTimeZone(new Date(), timezone);
    const weekday = new Date(`${today}T12:00:00Z`).getUTCDay();
    const periods: PeriodType[] = ["daily"];
    if (weekday === 1) periods.push("weekly");
    if (today.endsWith("-01")) periods.push("monthly");
    const enabled = {
      daily: settings?.daily_analysis_enabled ?? true,
      weekly: settings?.weekly_analysis_enabled ?? true,
      monthly: settings?.monthly_analysis_enabled ?? true,
    };
    const logs = [];
    for (const period of periods) {
      if (settings && (!settings.ai_analysis_enabled || !enabled[period])) {
        logs.push({ period, status: "skipped", reason: "disabled" });
        continue;
      }
      const range = completedPeriodRange(period, today);
      const result = await generateFinanceReport({ supabase, userId, periodType: period, range, skipExisting: true });
      logs.push({ period, range: { start: range.start, end: range.end }, status: result.ok ? result.status : result.status, message: result.message });
    }
    return NextResponse.json({ ok: true, run_date: today, timezone, jobs: logs });
  } catch (error) {
    console.error("Finance analysis cron failed", error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Cron failed" }, { status: 500 });
  }
}
