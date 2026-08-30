import { Suspense } from "react";
import DashboardContent from "./dashboard-content";

export const metadata = { title: "Dashboard" };

function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-24 rounded-3xl bg-blue-100/60" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-32 rounded-[22px] bg-white" />)}
      </div>
      <div className="grid gap-5 xl:grid-cols-2"><div className="h-80 rounded-[22px] bg-white" /><div className="h-80 rounded-[22px] bg-white" /></div>
    </div>
  );
}

export default function DashboardPage() {
  return <Suspense fallback={<DashboardLoading />}><DashboardContent /></Suspense>;
}
