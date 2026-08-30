"use server";

import { z } from "zod";
import { requireOwnerForAction } from "@/lib/auth";
import type { ActionResult } from "@/app/protected/actions";

const subscriptionSchema = z.object({
  endpoint: z.url().max(2048),
  p256dh: z.string().min(1).max(512),
  auth: z.string().min(1).max(512),
});

function safeError(error: unknown, fallback: string) {
  console.error(fallback, error);
  if (error instanceof z.ZodError) return error.issues[0]?.message ?? fallback;
  return fallback;
}

export async function savePushSubscription(input: unknown): Promise<ActionResult> {
  try {
    const subscription = subscriptionSchema.parse(input);
    const { userId, supabase } = await requireOwnerForAction();
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.p256dh,
        auth: subscription.auth,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,endpoint" },
    );
    if (error) throw error;
    return { ok: true, message: "Notifications enabled" };
  } catch (error) {
    return { ok: false, message: safeError(error, "Unable to enable notifications") };
  }
}

export async function deletePushSubscription(endpoint: string): Promise<ActionResult> {
  try {
    const parsedEndpoint = z.url().max(2048).parse(endpoint);
    const { userId, supabase } = await requireOwnerForAction();
    const { error } = await supabase.from("push_subscriptions").delete().eq("user_id", userId).eq("endpoint", parsedEndpoint);
    if (error) throw error;
    return { ok: true, message: "Notifications disabled" };
  } catch (error) {
    return { ok: false, message: safeError(error, "Unable to disable notifications") };
  }
}
