import { CATEGORY_COLORS } from "@/lib/finance/constants";
import { formatCurrency } from "@/lib/finance/format";

export function CategoryChart({
  data,
  currency,
}: {
  data: Array<{ category: string; amountCents: number }>;
  currency: string;
}) {
  const total = data.reduce((sum, item) => sum + item.amountCents, 0);
  let cursor = 0;
  const gradient = data.length
    ? data
        .slice(0, 8)
        .map((item, index) => {
          const start = cursor;
          cursor += total ? (item.amountCents / total) * 100 : 0;
          return `${CATEGORY_COLORS[index % CATEGORY_COLORS.length]} ${start}% ${cursor}%`;
        })
        .join(",")
    : "#e9eef8 0 100%";

  return (
    <div className="mt-6 grid items-center gap-7 sm:grid-cols-[170px_1fr]">
      <div
        className="relative mx-auto grid size-40 place-items-center rounded-full"
        style={{ background: `conic-gradient(${gradient})` }}
        role="img"
        aria-label={`Category spending totaling ${formatCurrency(total, currency)}`}
      >
        <div className="grid size-24 place-items-center rounded-full bg-white text-center shadow-inner">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total</p>
            <p className="mt-1 text-sm font-extrabold text-slate-900">
              {formatCurrency(total, currency, true)}
            </p>
          </div>
        </div>
      </div>
      {data.length ? (
        <div className="space-y-3">
          {data.slice(0, 6).map((item, index) => (
            <div key={item.category} className="flex items-center gap-3 text-sm">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}
              />
              <span className="min-w-0 flex-1 truncate font-medium text-slate-600">{item.category}</span>
              <span className="font-bold tabular-nums text-slate-900">
                {formatCurrency(item.amountCents, currency)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-sm text-slate-400">No expense data in this period.</p>
      )}
    </div>
  );
}

export function TrendChart({
  data,
  currency,
}: {
  data: Array<{ date: string; expenseCents: number; incomeCents?: number }>;
  currency: string;
}) {
  const values = data.map((point) => point.expenseCents);
  const max = Math.max(...values, 1);
  const points = data
    .map((point, index) => {
      const x = data.length === 1 ? 50 : (index / (data.length - 1)) * 100;
      const y = 94 - (point.expenseCents / max) * 82;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="mt-5">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-48 w-full overflow-visible" role="img" aria-label="Daily spending trend">
        <defs>
          <linearGradient id="spending-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2855d9" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#2855d9" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[20, 40, 60, 80].map((y) => (
          <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="#e8edf7" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
        ))}
        {points ? (
          <>
            <polygon points={`0,100 ${points} 100,100`} fill="url(#spending-fill)" />
            <polyline points={points} fill="none" stroke="#2855d9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          </>
        ) : null}
      </svg>
      <div className="mt-2 flex items-center justify-between text-xs font-medium text-slate-400">
        <span>{data[0]?.date.slice(5) ?? "—"}</span>
        <span>Peak {formatCurrency(max, currency, true)}</span>
        <span>{data.at(-1)?.date.slice(5) ?? "—"}</span>
      </div>
    </div>
  );
}
