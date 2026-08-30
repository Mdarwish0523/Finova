"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import type { settings as settingsTable } from "@/lib/db/schema";
import { saveSettings } from "@/app/protected/actions";
import { CURRENCIES, TIME_ZONES } from "@/lib/finance/constants";

type Settings = typeof settingsTable.$inferSelect;

export function SettingsForm({ settings }: { settings: Settings | null }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await saveSettings(formData);
      setMessage(result.message);
    });
  }

  return (
    <form action={submit} className="space-y-5">
      <section className="finance-card p-5 sm:p-6">
        <h2 className="text-lg font-extrabold">Money preferences</h2>
        <p className="mt-1 text-sm text-slate-400">The starting balance is combined with all recorded cash flow.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="field-label">Starting balance<input className="field-input mt-2" name="startingBalance" inputMode="decimal" required defaultValue={(Number(settings?.starting_balance_cents ?? 0) / 100).toFixed(2)} /></label>
          <label className="field-label">Monthly spending budget<input className="field-input mt-2" name="monthlyBudget" inputMode="decimal" placeholder="Optional" defaultValue={settings?.monthly_budget_cents == null ? "" : (Number(settings.monthly_budget_cents) / 100).toFixed(2)} /></label>
          <label className="field-label">Currency<select className="field-input mt-2" name="currency" defaultValue={settings?.currency ?? "USD"}>{CURRENCIES.map((currency) => <option key={currency}>{currency}</option>)}</select></label>
          <label className="field-label">Time zone<select className="field-input mt-2" name="timezone" defaultValue={settings?.timezone ?? "America/New_York"}>{TIME_ZONES.map((timezone) => <option key={timezone}>{timezone.replaceAll("_", " ")}</option>)}</select></label>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
        {message ? <p role="status" className="flex flex-1 items-center gap-2 text-sm font-semibold text-slate-500"><CheckCircle2 className="size-4 text-emerald-500" />{message}</p> : null}
        <button className="primary-button" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}{pending ? "Saving…" : "Save settings"}</button>
      </div>
    </form>
  );
}
