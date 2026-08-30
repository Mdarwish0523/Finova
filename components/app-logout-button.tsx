"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";

export function AppLogoutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);

    const supabase = createClient();
    await supabase.auth.signOut();

    router.replace("/auth/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className={compact
        ? "icon-button"
        : "flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"}
      aria-label={compact ? "Sign out" : undefined}
    >
      <LogOut className="size-4" />
      {compact ? null : loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
