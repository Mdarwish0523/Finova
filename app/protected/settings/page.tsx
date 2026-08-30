import { Suspense } from "react";
import { Download, MonitorSmartphone, ShieldCheck, Smartphone } from "lucide-react";
import { requireOwner } from "@/lib/auth";
import { PageHeader, SectionHeading } from "@/components/finance/page-header";
import { SettingsForm } from "@/components/finance/settings-form";
import { NotificationSettings } from "@/components/finance/notification-settings";

export const metadata = { title: "Settings" };

async function SettingsContent() {
  const { userId, supabase } = await requireOwner();
  const { data, error } = await supabase.from("user_settings").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw new Error("Unable to load settings");
  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Preferences" title="Settings" description="Choose how balances, budgets, scheduling, and optional AI analysis work for you." />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <SettingsForm settings={data} />
        <div className="space-y-5">
          <NotificationSettings publicVapidKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""} />
          <section className="finance-card p-5 sm:p-6"><SectionHeading title="Install Finova" description="Launch it like a native app, without a browser tab." /><div className="mt-5 space-y-4 text-sm leading-6 text-slate-600"><div className="flex gap-3"><Smartphone className="mt-1 size-5 shrink-0 text-blue-700" /><p><strong className="text-slate-900">iPhone or iPad:</strong> Open in Safari, tap Share, then “Add to Home Screen.”</p></div><div className="flex gap-3"><Download className="mt-1 size-5 shrink-0 text-blue-700" /><p><strong className="text-slate-900">Android:</strong> Open the browser menu and choose “Install app” or “Add to Home screen.”</p></div><div className="flex gap-3"><MonitorSmartphone className="mt-1 size-5 shrink-0 text-blue-700" /><p><strong className="text-slate-900">Desktop:</strong> Use the install icon in the browser address bar.</p></div></div></section>
          <section className="rounded-[22px] bg-slate-950 p-6 text-white shadow-xl"><ShieldCheck className="size-6 text-blue-300" /><h2 className="mt-4 font-extrabold">Privacy and security</h2><p className="mt-2 text-sm leading-6 text-slate-300">Owner-only server checks and database row-level security protect every finance record. No service-role or OpenAI secret is shipped to the browser.</p></section>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return <Suspense fallback={<div className="h-96 animate-pulse rounded-[22px] bg-white" />}><SettingsContent /></Suspense>;
}
