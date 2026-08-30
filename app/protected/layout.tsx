import {
  Suspense,
  type ReactNode,
} from "react";

import { AppShell } from "@/components/finance/app-shell";
import { getActiveRecurringExpenses } from "@/lib/db/queries";

function ShellLoading() {
  return (
    <div className="min-h-[100svh] animate-pulse bg-[#f7f8fc]" />
  );
}

async function LocalShell({
  children,
}: {
  children: ReactNode;
}) {
  const recurring = getActiveRecurringExpenses().map(
    ({ id, name }) => ({
      id,
      name,
    }),
  );

  return (
    <AppShell recurring={recurring}>
      {children}
    </AppShell>
  );
}

export default function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense fallback={<ShellLoading />}>
      <LocalShell>{children}</LocalShell>
    </Suspense>
  );
}
