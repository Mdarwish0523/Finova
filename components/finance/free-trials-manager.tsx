"use client";

import { useMemo, useState, useTransition } from "react";
import { Bell, CalendarDays, CreditCard, Edit3, LoaderCircle, Plus, RotateCcw, Trash2, X, XCircle } from "lucide-react";
import type { freeTrials } from "@/lib/db/schema";
import { deleteFreeTrial, saveFreeTrial, setFreeTrialStatus } from "@/app/protected/trials/actions";
import { formatDate } from "@/lib/finance/format";
import { shiftDate } from "@/lib/finance/dates";

type Trial = typeof freeTrials.$inferSelect;

function daysFrom(start: string, end: string) {
  return Math.round((Date.parse(`${end}T12:00:00Z`) - Date.parse(`${start}T12:00:00Z`)) / 86_400_000);
}

function statusText(trial: Trial, today: string) {
  if (trial.status === "cancelled") return "Cancelled";
  const days = daysFrom(today, trial.charge_date);
  if (days < 0) return "Charge date passed";
  if (days === 0) return "Charges today";
  if (days === 1) return "Charges tomorrow";
  return `Charges in ${days} days`;
}

function TrialForm({ trial, today, onClose }: { trial: Trial | null; today: string; onClose: () => void }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const preset = trial && [7, 14, 30].includes(trial.duration_days) ? String(trial.duration_days) : "custom";
  const [durationOption, setDurationOption] = useState(preset || "7");
  const [durationDays, setDurationDays] = useState(trial?.duration_days ?? 7);
  const [startDate, setStartDate] = useState(trial?.start_date ?? today);
  const chargeDate = startDate && durationDays > 0 ? shiftDate(startDate, durationDays) : "";

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await saveFreeTrial(formData);
      setMessage(result.message);
      if (result.ok) window.setTimeout(onClose, 450);
    });
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/35 backdrop-blur-sm sm:items-center sm:p-6" onMouseDown={(event) => event.currentTarget === event.target && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="trial-form-title" className="max-h-[92svh] w-full overflow-y-auto rounded-t-[28px] bg-white p-5 shadow-2xl sm:max-w-xl sm:rounded-[28px] sm:p-7">
        <div className="flex justify-between gap-3">
          <div><p className="text-xs font-bold uppercase tracking-wider text-blue-600">Expected charge</p><h2 id="trial-form-title" className="mt-1 text-2xl font-extrabold">{trial ? "Edit free trial" : "Add free trial"}</h2></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close"><X className="size-5" /></button>
        </div>
        <form action={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
          {trial ? <input type="hidden" name="id" value={trial.id} /> : null}
          <input type="hidden" name="status" value={trial?.status ?? "active"} />
          <input type="hidden" name="durationDays" value={durationDays} />
          <label className="field-label sm:col-span-2">Service name<input autoFocus className="field-input mt-2" name="serviceName" required maxLength={120} placeholder="Adobe, Apple Music…" defaultValue={trial?.service_name} /></label>
          <label className="field-label">Trial started<input className="field-input mt-2" name="startDate" type="date" required value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
          <label className="field-label">Trial length<select className="field-input mt-2" value={durationOption} onChange={(event) => { const option = event.target.value; setDurationOption(option); if (option !== "custom") setDurationDays(Number(option)); }}><option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option><option value="custom">Custom</option></select></label>
          {durationOption === "custom" ? <label className="field-label sm:col-span-2">Custom length in days<input className="field-input mt-2" type="number" min="1" max="36500" required value={durationDays} onChange={(event) => setDurationDays(Number(event.target.value))} /></label> : null}
          <div className="rounded-2xl bg-blue-50 p-4 sm:col-span-2"><p className="text-xs font-bold uppercase tracking-wide text-blue-600">Expected charge date</p><p className="mt-1 font-extrabold text-blue-950">{chargeDate ? formatDate(chargeDate, { month: "long", day: "numeric", year: "numeric" }) : "Choose a start date and length"}</p></div>
          <label className="field-label sm:col-span-2">Card used<input className="field-input mt-2" name="cardLabel" required maxLength={120} placeholder="Apple Card, Amex ending 1234, PayPal…" defaultValue={trial?.card_label} /><span className="mt-2 block text-xs font-normal leading-5 text-slate-400">Use a label or last four digits only. Never enter a full card number, CVV, or expiration date.</span></label>
          <label className="field-label sm:col-span-2">Notes <span className="font-normal text-slate-400">(optional)</span><textarea className="field-input mt-2 min-h-24 py-3" name="notes" maxLength={500} defaultValue={trial?.notes ?? ""} /></label>
          <div className="space-y-3 rounded-2xl border border-slate-100 p-4 sm:col-span-2">
            <p className="text-sm font-extrabold text-slate-800">Reminder flags</p>
            <p className="text-xs leading-5 text-slate-400">Stored locally for reference. Finova does not send cloud push notifications.</p>
            <label className="flex items-center justify-between gap-4 text-sm font-semibold text-slate-600"><span>2 days before</span><input className="size-5 accent-blue-700" type="checkbox" name="remindTwoDays" defaultChecked={trial?.remind_two_days ?? true} /></label>
            <label className="flex items-center justify-between gap-4 text-sm font-semibold text-slate-600"><span>1 day before</span><input className="size-5 accent-blue-700" type="checkbox" name="remindOneDay" defaultChecked={trial?.remind_one_day ?? true} /></label>
          </div>
          {message ? <p role="status" className="text-sm font-semibold text-slate-500 sm:col-span-2">{message}</p> : null}
          <button className="primary-button sm:col-span-2" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}{pending ? "Saving…" : "Save free trial"}</button>
        </form>
      </section>
    </div>
  );
}

function TrialCard({ trial, today, pending, onEdit, onStatus, onDelete }: { trial: Trial; today: string; pending: boolean; onEdit: () => void; onStatus: () => void; onDelete: () => void }) {
  const cancelled = trial.status === "cancelled";
  const reminderText = [trial.remind_two_days ? "2 days" : null, trial.remind_one_day ? "1 day" : null].filter(Boolean).join(" and ") || "Off";
  return (
    <article className={`finance-card p-5 ${cancelled ? "opacity-70" : ""}`}>
      <div className="flex items-start justify-between gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-blue-50 text-blue-700"><CalendarDays className="size-5" /></span><span className={`chip ${cancelled ? "" : "!bg-amber-50 !text-amber-700"}`}>{statusText(trial, today)}</span></div>
      <h3 className="mt-4 truncate text-lg font-extrabold text-slate-950">{trial.service_name}</h3>
      <p className="mt-1 text-sm font-semibold text-slate-500">{formatDate(trial.charge_date, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</p>
      <div className="mt-5 space-y-3 rounded-2xl bg-slate-50 p-4 text-sm">
        <p className="flex items-center gap-2 text-slate-600"><CreditCard className="size-4 text-blue-600" /><span className="truncate">{trial.card_label}</span></p>
        <p className="flex items-center gap-2 text-slate-600"><Bell className="size-4 text-blue-600" /><span>{reminderText === "Off" ? "Reminder flags off" : `${reminderText} before`}</span></p>
      </div>
      {trial.notes ? <p className="mt-4 line-clamp-2 text-xs leading-5 text-slate-400">{trial.notes}</p> : null}
      <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        <button className="secondary-button flex-1" disabled={pending} onClick={onStatus}>{cancelled ? <RotateCcw className="size-4" /> : <XCircle className="size-4" />}{cancelled ? "Restore active" : "Mark cancelled"}</button>
        <button className="icon-button !size-11" onClick={onEdit} aria-label={`Edit ${trial.service_name}`}><Edit3 className="size-4" /></button>
        <button className="icon-button !size-11 hover:!border-rose-200 hover:!bg-rose-50 hover:!text-rose-600" disabled={pending} onClick={onDelete} aria-label={`Delete ${trial.service_name}`}><Trash2 className="size-4" /></button>
      </div>
    </article>
  );
}

export function FreeTrialsManager({ trials, today }: { trials: Trial[]; today: string }) {
  const [editing, setEditing] = useState<Trial | null | undefined>(undefined);
  const [pending, startTransition] = useTransition();
  const active = useMemo(() => trials.filter((trial) => trial.status === "active").sort((a, b) => a.charge_date.localeCompare(b.charge_date)), [trials]);
  const cancelled = useMemo(() => trials.filter((trial) => trial.status === "cancelled").sort((a, b) => b.updated_at.localeCompare(a.updated_at)), [trials]);

  function act(task: () => Promise<{ ok: boolean; message: string }>) {
    startTransition(async () => { const result = await task(); if (!result.ok) window.alert(result.message); });
  }

  function remove(trial: Trial) {
    if (window.confirm(`Delete ${trial.service_name}? This cannot be undone.`)) act(() => deleteFreeTrial(trial.id));
  }

  return (
    <>
      <div className="flex justify-end"><button type="button" className="primary-button w-full sm:w-auto" onClick={() => setEditing(null)}><Plus className="size-4" />Add free trial</button></div>
      <section aria-busy={pending}>
        <div className="mb-4"><h2 className="text-lg font-extrabold text-slate-950">Active trials</h2><p className="mt-1 text-sm text-slate-400">Closest expected charge dates appear first.</p></div>
        {active.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{active.map((trial) => <TrialCard key={trial.id} trial={trial} today={today} pending={pending} onEdit={() => setEditing(trial)} onStatus={() => act(() => setFreeTrialStatus(trial.id, "cancelled"))} onDelete={() => remove(trial)} />)}</div> : <div className="finance-card py-14 text-center"><CalendarDays className="mx-auto size-8 text-blue-600" /><h3 className="mt-4 text-lg font-bold">No active free trials</h3><p className="mt-2 text-sm text-slate-400">Add one to track its expected charge date.</p></div>}
      </section>
      {cancelled.length ? <section className="border-t border-slate-200 pt-7"><div className="mb-4"><h2 className="text-lg font-extrabold text-slate-950">Cancelled trials</h2><p className="mt-1 text-sm text-slate-400">Kept separately for reference.</p></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{cancelled.map((trial) => <TrialCard key={trial.id} trial={trial} today={today} pending={pending} onEdit={() => setEditing(trial)} onStatus={() => act(() => setFreeTrialStatus(trial.id, "active"))} onDelete={() => remove(trial)} />)}</div></section> : null}
      {editing !== undefined ? <TrialForm trial={editing} today={today} onClose={() => setEditing(undefined)} /> : null}
    </>
  );
}
