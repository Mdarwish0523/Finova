import { connection } from "next/server";
import { Suspense } from "react";
import { getSettings } from "@/lib/db/queries";
import { PageHeader } from "@/components/finance/page-header";
import { SettingsForm } from "@/components/finance/settings-form";

export const metadata = { title: "Settings" };

async function SettingsContent() {
  await connection();
  const data = getSettings();

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Preferences" title="Settings" description="Choose how balances, budgets, currency, and dates are shown in Finova." />
      <SettingsForm settings={data ?? null} />
    </div>
  );
}

export default function SettingsPage() {
  return <Suspense fallback={<div className="h-96 animate-pulse rounded-[22px] bg-white" />}><SettingsContent /></Suspense>;
}
