import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "blue",
}: {
  label: string;
  value: string;
  detail?: string;
  icon: LucideIcon;
  tone?: "blue" | "green" | "red" | "navy";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    red: "bg-rose-50 text-rose-600",
    navy: "bg-slate-100 text-slate-800",
  };
  return (
    <section className="finance-card min-w-0 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-3 truncate text-2xl font-bold tracking-[-0.035em] text-slate-950">{value}</p>
          {detail ? <p className="mt-2 text-xs leading-5 text-slate-400">{detail}</p> : null}
        </div>
        <span className={cn("rounded-2xl p-2.5", tones[tone])} aria-hidden="true">
          <Icon className="size-5" strokeWidth={2} />
        </span>
      </div>
    </section>
  );
}
