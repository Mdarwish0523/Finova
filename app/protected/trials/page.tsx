import { connection } from "next/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/finance/page-header";
import { FreeTrialsManager } from "@/components/finance/free-trials-manager";
import { getSettings } from "@/lib/db/queries";
import { db } from "@/lib/db";
import { freeTrials } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { dateInTimeZone } from "@/lib/finance/dates";

export const metadata = { title: "Free Trials" };

async function TrialsContent() {
  await connection();

  const settings = getSettings();
  const trials = db.select().from(freeTrials).orderBy(asc(freeTrials.charge_date)).all();
  const today = dateInTimeZone(
    new Date(),
    settings?.timezone ?? "America/New_York",
  );

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Trial reminders"
        title="Free Trials"
        description="Track trial end dates and expected charge dates locally."
      />
      <FreeTrialsManager trials={trials} today={today} />
    </div>
  );
}

export default function FreeTrialsPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-[22px] bg-white" />}>
      <TrialsContent />
    </Suspense>
  );
}
