"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { BarChart3, CalendarClock, Hourglass, LayoutDashboard, Plus, ReceiptText, Settings, WalletCards } from "lucide-react";
import type { Tables } from "@/lib/database.types";
import { AppLogoutButton } from "@/components/app-logout-button";
import { TransactionDialog } from "@/components/finance/transaction-dialog";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/protected", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/protected/transactions", label: "Transactions", icon: ReceiptText },
  { href: "/protected/recurring", label: "Recurring", icon: CalendarClock },
  { href: "/protected/trials", label: "Free Trials", mobileLabel: "Trials", icon: Hourglass },
  { href: "/protected/reports", label: "Reports", icon: BarChart3 },
  { href: "/protected/settings", label: "Settings", icon: Settings },
];

export function AppShell({
  children,
  recurring,
}: {
  children: ReactNode;
  recurring: Pick<Tables<"recurring_expenses">, "id" | "name">[];
}) {
  const pathname = usePathname();
  const [dialogOpen, setDialogOpen] = useState(false);
  const closeDialog = useCallback(() => setDialogOpen(false), []);

  useEffect(() => {
    const open = () => setDialogOpen(true);
    window.addEventListener("money:add-transaction", open);
    return () => window.removeEventListener("money:add-transaction", open);
  }, []);

  return (
    <div className="min-h-[100svh] bg-[#f7f8fc] text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-blue-100/80 bg-white px-4 py-6 lg:flex">
        <Link href="/protected" className="flex items-center gap-3 px-3">
          <span className="grid size-11 place-items-center rounded-[17px] bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-lg shadow-blue-200"><WalletCards className="size-6" /></span>
          <span><strong className="block text-lg tracking-tight text-slate-950">Finova</strong><span className="text-xs font-medium text-slate-400">Personal finance</span></span>
        </Link>
        <nav className="mt-10 space-y-1.5" aria-label="Primary navigation">
          {navigation.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition", active ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900")}>
                <item.icon className="size-5" />{item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-[22px] bg-gradient-to-br from-slate-950 to-blue-950 p-4 text-white">
          <p className="text-sm font-bold">Private by design</p>
          <p className="mt-1 text-xs leading-5 text-blue-100/70">Your finance workspace is protected by owner-only access and row security.</p>
        </div>
        <div className="mt-4"><AppLogoutButton /></div>
      </aside>

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-blue-100/70 bg-white/90 px-4 backdrop-blur-xl lg:hidden">
        <Link href="/protected" className="flex items-center gap-2.5 font-extrabold tracking-tight text-slate-950">
          <span className="grid size-9 place-items-center rounded-xl bg-blue-700 text-white"><WalletCards className="size-5" /></span>Finova
        </Link>
        <AppLogoutButton compact />
      </header>

      <main className="min-w-0 pb-[calc(6.5rem+env(safe-area-inset-bottom))] lg:ml-64 lg:pb-10">
        <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-7 lg:px-10 lg:py-9">{children}</div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-blue-100 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_rgba(29,68,153,0.08)] backdrop-blur-xl lg:hidden" aria-label="Mobile navigation">
        <div className="grid h-20 grid-cols-6 items-center">
          {navigation.map((item, index) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            if (index === 2) {
              return (
                <div key={item.href} className="relative flex justify-center">
                  <button type="button" onClick={() => setDialogOpen(true)} className="absolute -top-12 grid size-16 place-items-center rounded-full border-[6px] border-[#f7f8fc] bg-blue-700 text-white shadow-xl shadow-blue-300" aria-label="Add transaction"><Plus className="size-7" /></button>
                  <Link href={item.href} className={cn("mt-7 text-[10px] font-bold", active ? "text-blue-700" : "text-slate-400")}>Recurring</Link>
                </div>
              );
            }
            return (
              <Link key={item.href} href={item.href} className={cn("flex h-full flex-col items-center justify-center gap-1 text-[10px] font-bold", active ? "text-blue-700" : "text-slate-400")}>
                <item.icon className="size-5" />{"mobileLabel" in item ? item.mobileLabel : item.label}
              </Link>
            );
          })}
        </div>
      </nav>
      <TransactionDialog open={dialogOpen} onClose={closeDialog} recurring={recurring} />
    </div>
  );
}
