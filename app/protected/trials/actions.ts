"use server";

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/app/protected/actions";
import { db } from "@/lib/db";
import { freeTrials } from "@/lib/db/schema";
import { shiftDate } from "@/lib/finance/dates";
import { freeTrialSchema } from "@/lib/finance/validation";

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

    if (parsed.id) {
      db.update(freeTrials).set(payload).where(eq(freeTrials.id, parsed.id)).run();
    } else {
      db.insert(freeTrials).values({ id: randomUUID(), ...payload }).run();
    }

    refreshTrials();
    return { ok: true, message: parsed.id ? "Free trial updated" : "Free trial added" };
  } catch (error) {
    return { ok: false, message: safeError(error, "Unable to save free trial") };
  }
}

export async function setFreeTrialStatus(
  id: string,
  status: "active" | "cancelled",
): Promise<ActionResult> {
  try {
    const trialId = z.string().uuid().parse(id);
    const nextStatus = z.enum(["active", "cancelled"]).parse(status);

    db.update(freeTrials)
      .set({ status: nextStatus, updated_at: new Date().toISOString() })
      .where(eq(freeTrials.id, trialId))
      .run();

    refreshTrials();
    return {
      ok: true,
      message: nextStatus === "active" ? "Free trial restored" : "Free trial cancelled",
    };
  } catch (error) {
    return { ok: false, message: safeError(error, "Unable to update free trial") };
  }
}

export async function deleteFreeTrial(id: string): Promise<ActionResult> {
  try {
    const trialId = z.string().uuid().parse(id);
    db.delete(freeTrials).where(eq(freeTrials.id, trialId)).run();
    refreshTrials();
    return { ok: true, message: "Free trial deleted" };
  } catch (error) {
    return { ok: false, message: safeError(error, "Unable to delete free trial") };
  }
}
