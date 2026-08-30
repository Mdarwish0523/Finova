"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOwnerForAction } from "@/lib/auth";
import { shiftDate } from "@/lib/finance/dates";
import { freeTrialSchema } from "@/lib/finance/validation";
import type { ActionResult } from "@/app/protected/actions";

function value(formData: FormData, name: string) {
  return String(formData.get(name) ?? "");
}

function safeError(error: unknown, fallback: string) {
  console.error(fallback, error);
  if (error instanceof z.ZodError) return error.issues[0]?.message ?? fallback;
  return fallback;
}

function refreshTrials() {
  revalidatePath("/protected");
  revalidatePath("/protected/trials");
}

export async function saveFreeTrial(formData: FormData): Promise<ActionResult> {
  try {
    const { userId, supabase } = await requireOwnerForAction();
    const parsed = freeTrialSchema.parse({
      id: value(formData, "id") || undefined,
      serviceName: value(formData, "serviceName"),
      startDate: value(formData, "startDate"),
      durationDays: value(formData, "durationDays"),
      cardLabel: value(formData, "cardLabel"),
      notes: value(formData, "notes"),
      status: value(formData, "status") || "active",
      remindTwoDays: formData.has("remindTwoDays"),
      remindOneDay: formData.has("remindOneDay"),
    });
    const payload = {
      user_id: userId,
      service_name: parsed.serviceName,
      start_date: parsed.startDate,
      duration_days: parsed.durationDays,
      charge_date: shiftDate(parsed.startDate, parsed.durationDays),
      card_label: parsed.cardLabel,
      notes: parsed.notes,
      status: parsed.status,
      remind_two_days: parsed.remindTwoDays,
      remind_one_day: parsed.remindOneDay,
      updated_at: new Date().toISOString(),
    };
    const response = parsed.id
      ? await supabase.from("free_trials").update(payload).eq("id", parsed.id).eq("user_id", userId)
      : await supabase.from("free_trials").insert(payload);
    if (response.error) throw response.error;
    refreshTrials();
    return { ok: true, message: parsed.id ? "Free trial updated" : "Free trial added" };
  } catch (error) {
    return { ok: false, message: safeError(error, "Unable to save free trial") };
  }
}

export async function setFreeTrialStatus(id: string, status: "active" | "cancelled"): Promise<ActionResult> {
  try {
    const trialId = z.string().uuid().parse(id);
    const nextStatus = z.enum(["active", "cancelled"]).parse(status);
    const { userId, supabase } = await requireOwnerForAction();
    const { error } = await supabase
      .from("free_trials")
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq("id", trialId)
      .eq("user_id", userId);
    if (error) throw error;
    refreshTrials();
    return { ok: true, message: nextStatus === "active" ? "Free trial restored" : "Free trial cancelled" };
  } catch (error) {
    return { ok: false, message: safeError(error, "Unable to update free trial") };
  }
}

export async function deleteFreeTrial(id: string): Promise<ActionResult> {
  try {
    const trialId = z.string().uuid().parse(id);
    const { userId, supabase } = await requireOwnerForAction();
    const { error } = await supabase.from("free_trials").delete().eq("id", trialId).eq("user_id", userId);
    if (error) throw error;
    refreshTrials();
    return { ok: true, message: "Free trial deleted" };
  } catch (error) {
    return { ok: false, message: safeError(error, "Unable to delete free trial") };
  }
}
