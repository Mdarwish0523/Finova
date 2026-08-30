import { Suspense } from "react";
import { Database, Download, MonitorSmartphone, Smartphone } from "lucide-react";
import { getSettings } from "@/lib/db/queries";
import { PageHeader, SectionHeading } from "@/components/finance/page-header";
import { SettingsForm } from "@/components/finance/settings-form";

export const metadata = { title: "Settings" };

async function SettingsContent() {
  const data = getSettings();

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Preferences" title="Settings" description="Choose how balances, budgets, currency, and dates are shown in Finova." />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <SettingsForm settings={data ?? null} />
        <div className="space-y-5">
          <section className="finance-card p-5 sm:p-6">
            <SectionHeading title="Run Finova locally" description="The app and its data stay on this computer." />
            <div className="mt-5 space-y-4 text-sm leading-6 text-slate-600">
              <div className="flex gap-3"><Smartphone className="mt-1 size-5 shrink-0 text-blue-700" /><p><strong className="text-slate-900">Phone or tablet:</strong> Open the local server from your network address while the development server is running.</p></div>
              <div className="flex gap-3"><Download className="mt-1 size-5 shrink-0 text-blue-700" /><p><strong className="text-slate-900">Install:</strong> Run <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">npm install</code> after cloning the repository.</p></div>
              <div className="flex gap-3"><MonitorSmartphone className="mt-1 size-5 shrink-0 text-blue-700" /><p><strong className="text-slate-900">Desktop:</strong> Start Finova with <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">npm run dev</code> and open the localhost address shown in the terminal.</p></div>
            </div>
          </section>
          <section className="rounded-[22px] bg-slate-950 p-6 text-white shadow-xl">
            <Database className="size-6 text-blue-300" />
            <h2 className="mt-4 font-extrabold">Local data</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">Transactions, recurring bills, free trials, and settings are stored in <code>data/finova.db</code>. No account, Supabase project, or cloud database is required.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return <Suspense fallback={<div className="h-96 animate-pulse rounded-[22px] bg-white" />}><SettingsContent /></Suspense>;
}
