export default function Loading() {
  return <div className="space-y-5 animate-pulse"><div className="h-24 rounded-3xl bg-blue-100/60" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-32 rounded-[22px] bg-white" />)}</div></div>;
}
