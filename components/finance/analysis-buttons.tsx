"use client";

import { useState, useTransition } from "react";
import { LoaderCircle, Sparkles } from "lucide-react";
import { generateAnalysis } from "@/app/protected/reports/actions";

export function AnalysisButtons() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {(["daily", "weekly", "monthly"] as const).map((period) => (
          <button key={period} type="button" className="secondary-button capitalize" disabled={pending} onClick={() => startTransition(async () => { const result = await generateAnalysis(period); setMessage(result.message); })}>
            {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}{period} analysis
          </button>
        ))}
      </div>
      {message ? <p className="mt-3 text-sm font-semibold text-slate-500" role="status">{message}</p> : null}
    </div>
  );
}
