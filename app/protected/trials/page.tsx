import { Suspense } from "react";
import { PageHeader } from "@/components/finance/page-header";
import { FreeTrialsManager } from "@/components/finance/free-trials-manager";
import { requireOwner } from "@/lib/auth";
import { dateInTimeZone } from "@/lib/finance/dates";

export const metadata = { title: "Free Trials" };

async function TrialsContent() {
  const { userId, supabase } = await requireOwner();
  const [{ data: settings }, { data: trials, error }] = await Promise.all([
    supabase.from("user_settings").select("timezone").eq("user_id", userId).maybeSingle(),
    supabase.from("free_trials").select("*").eq("user_id", userId).order("charge_date"),
  ]);
  if (error) throw new Error("Unable to load free trials");
  const today = dateInTimeZone(new Date(), settings?.timezone ?? process.env.APP_TIMEZONE ?? "America/New_York");
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Trial reminders"
        title="Free Trials"
        description="Track trial end dates and get a heads-up before an expected charge."
      />
      <FreeTrialsManager trials={trials ?? []} today={today} />
    </div>
  );
}

export default function FreeTrialsPage() {
  return <Suspense fallback={<div className="h-96 animate-pulse rounded-[22px] bg-white" />}><TrialsContent /></Suspense>;
}
