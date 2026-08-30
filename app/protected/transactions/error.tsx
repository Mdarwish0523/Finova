"use client";

export default function ErrorState({ reset }: { reset: () => void }) {
  return <div className="finance-card p-10 text-center"><h2 className="text-lg font-bold">Transactions could not load</h2><p className="mt-2 text-sm text-slate-500">Your data was not changed. Try the request again.</p><button className="secondary-button mt-5" onClick={reset}>Try again</button></div>;
}
