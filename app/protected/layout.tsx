import { Suspense, type ReactNode } from "react";
import { AppShell } from "@/components/finance/app-shell";
import { requireOwner } from "@/lib/auth";

function ShellLoading() {
  return <div className="min-h-[100svh] animate-pulse bg-[#f7f8fc]" />;
}

async function ProtectedShell({ children }: { children: ReactNode }) {
  const { userId, supabase } = await requireOwner();
  const { data, error } = await supabase
    .from("recurring_expenses")
    .select("id, name")
    .eq("user_id", userId)
    .eq("active", true)
    .order("name");
  if (error) throw new Error("Unable to load application shell");
  return <AppShell recurring={data ?? []}>{children}</AppShell>;
}

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<ShellLoading />}>
      <ProtectedShell>{children}</ProtectedShell>
    </Suspense>
  );
}
