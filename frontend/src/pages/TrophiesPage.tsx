import { useOutletContext } from "react-router-dom";
import { Header } from "@/components/Header";
import type { AppOutletContext } from "@/layouts/outletContext";

export function TrophiesPage() {
  const { stats } = useOutletContext<AppOutletContext>();

  return (
    <>
      <Header title="Trophies" stats={stats} />
      <main className="flex-1 space-y-6 overflow-auto p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-amber-500/30 bg-slate-900/50 p-6 text-center">
            <p className="text-3xl">🥇</p>
            <p className="mt-2 text-2xl font-semibold">{stats?.term?.goldMedals ?? 0}</p>
            <p className="text-sm text-slate-500">Gold</p>
          </div>
          <div className="rounded-2xl border border-slate-600/50 bg-slate-900/50 p-6 text-center">
            <p className="text-3xl">🥈</p>
            <p className="mt-2 text-2xl font-semibold">{stats?.term?.silverMedals ?? 0}</p>
            <p className="text-sm text-slate-500">Silver</p>
          </div>
          <div className="rounded-2xl border border-amber-800/40 bg-slate-900/50 p-6 text-center">
            <p className="text-3xl">🥉</p>
            <p className="mt-2 text-2xl font-semibold">{stats?.term?.bronzeMedals ?? 0}</p>
            <p className="text-sm text-slate-500">Bronze</p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <p className="text-sm font-medium">Streak</p>
          <p className="mt-2 text-4xl">🔥 {stats?.streak ?? 0} days</p>
          <p className="mt-2 text-sm text-slate-500">
            Edit medal counts on Term Configuration (active term).
          </p>
        </div>
      </main>
    </>
  );
}
