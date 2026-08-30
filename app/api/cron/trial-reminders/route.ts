import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import webPush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import { dateInTimeZone, shiftDate } from "@/lib/finance/dates";
import { formatDate } from "@/lib/finance/format";

export const maxDuration = 300;

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization");
  if (!secret || !header?.startsWith("Bearer ")) return false;
  const received = Buffer.from(header.slice(7));
  const expected = Buffer.from(secret);
  return received.length === expected.length && timingSafeEqual(received, expected);
}

function pushStatus(error: unknown) {
  if (error && typeof error === "object" && "statusCode" in error && typeof error.statusCode === "number") return error.statusCode;
  return null;
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const userId = process.env.OWNER_USER_ID;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!userId || !publicKey || !privateKey || !subject) {
    return NextResponse.json({ ok: false, error: "Push notification environment variables are not configured" }, { status: 500 });
  }

  try {
    webPush.setVapidDetails(subject, publicKey, privateKey);
    const supabase = createAdminClient();
    const [{ data: settings, error: settingsError }, { data: subscriptions, error: subscriptionsError }] = await Promise.all([
      supabase.from("user_settings").select("timezone").eq("user_id", userId).maybeSingle(),
      supabase.from("push_subscriptions").select("id, endpoint, p256dh, auth").eq("user_id", userId),
    ]);
    if (settingsError || subscriptionsError) throw settingsError ?? subscriptionsError;
    const timezone = process.env.APP_TIMEZONE || settings?.timezone || "America/New_York";
    const today = dateInTimeZone(new Date(), timezone);
    const oneDay = shiftDate(today, 1);
    const twoDays = shiftDate(today, 2);
    const { data: trials, error: trialsError } = await supabase
      .from("free_trials")
      .select("id, user_id, service_name, charge_date, card_label, remind_two_days, remind_one_day")
      .eq("user_id", userId)
      .eq("status", "active")
      .in("charge_date", [oneDay, twoDays]);
    if (trialsError) throw trialsError;

    let sent = 0;
    let skipped = 0;
    let failed = 0;
    for (const trial of trials ?? []) {
      const reminderDays = trial.charge_date === twoDays ? 2 : 1;
      if ((reminderDays === 2 && !trial.remind_two_days) || (reminderDays === 1 && !trial.remind_one_day)) {
        skipped += 1;
        continue;
      }
      for (const subscription of subscriptions ?? []) {
        const { data: claim, error: claimError } = await supabase
          .from("trial_notification_deliveries")
          .insert({
            user_id: trial.user_id,
            free_trial_id: trial.id,
            push_subscription_id: subscription.id,
            reminder_days: reminderDays,
            charge_date: trial.charge_date,
          })
          .select("id")
          .single();
        if (claimError?.code === "23505") {
          skipped += 1;
          continue;
        }
        if (claimError || !claim) throw claimError ?? new Error("Unable to reserve notification delivery");

        const title = reminderDays === 1 ? `${trial.service_name} trial charges tomorrow` : `${trial.service_name} trial charges in 2 days`;
        const body = reminderDays === 1
          ? "Review or cancel it before the expected charge date."
          : `Your ${trial.service_name} trial is expected to charge ${trial.card_label} on ${formatDate(trial.charge_date, { month: "long", day: "numeric" })}.`;
        try {
          await webPush.sendNotification(
            { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
            JSON.stringify({ title, body, url: "/protected/trials", tag: `trial-${trial.id}-${reminderDays}-${trial.charge_date}` }),
            { TTL: 86_400 },
          );
          const { error: sentError } = await supabase.from("trial_notification_deliveries").update({ sent_at: new Date().toISOString() }).eq("id", claim.id);
          if (sentError) throw sentError;
          sent += 1;
        } catch (error) {
          const status = pushStatus(error);
          if (status === 404 || status === 410) {
            await supabase.from("push_subscriptions").delete().eq("id", subscription.id);
          } else {
            await supabase.from("trial_notification_deliveries").delete().eq("id", claim.id);
          }
          console.error("Trial reminder push failed", { status, trialId: trial.id });
          failed += 1;
        }
      }
    }
    return NextResponse.json({ ok: true, run_date: today, timezone, sent, skipped, failed });
  } catch (error) {
    console.error("Trial reminder cron failed", error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Cron failed" }, { status: 500 });
  }
}
