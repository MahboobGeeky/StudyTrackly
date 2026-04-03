import { Clapperboard, HelpCircle } from "lucide-react";
import { format, getISOWeek } from "date-fns";
import { useOutletContext } from "react-router-dom";
import { HeaderToolbar } from "@/components/HeaderToolbar";
import type { AppOutletContext } from "@/layouts/outletContext";
import { formatMinutes } from "@/lib/format";
import type { DashboardStats } from "@/types";

type Props = {
  title: string;
  stats: DashboardStats | null;
  breadcrumb?: string;
};

export function Header({ title, stats, breadcrumb }: Props) {
  const outlet = useOutletContext<AppOutletContext | undefined>();
  const settings = outlet?.settings;
  const vol = settings?.timerVolume ?? 0.45;
  const smartTimerRingtone = settings?.smartTimerRingtone ?? "soft_chime";
  const reloadStats = outlet?.reload;

  const d = new Date();
  const line =
    breadcrumb ??
    `${format(d, "dd/MM/yy")} • CALENDAR WEEK ${getISOWeek(d)} • ${stats?.term?.name ?? "—"}`;

  const totalM = stats?.totals?.totalMinutes ?? 0;
  const goalH = stats?.term?.studyGoalHours ?? 600;
  const studyPct = stats?.progress?.studyProgressPct ?? 0;
  const timePct = stats?.progress?.timeElapsedPct ?? 0;

  return (
    <header className="border-b border-slate-800 bg-slate-950/50">
      <div className="flex flex-wrap items-start justify-between gap-4 px-6 py-6">
        <div>
          <p className="text-[0.8125rem] uppercase tracking-wide text-slate-500">{line}</p>
          <div className="mt-2 flex items-center gap-2">
            <h1 className="text-[1.65rem] font-semibold tracking-tight">{title}</h1>
            <span className="text-xl opacity-70" title="Fun">
              🃏
            </span>
            <button
              type="button"
              className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300"
              aria-label="Help"
            >
              <HelpCircle className="h-5 w-5" />
            </button>
          </div>
        </div>

        <HeaderToolbar
          timerVolume={vol}
          smartTimerRingtone={smartTimerRingtone}
          onSessionSaved={reloadStats}
        />
      </div>

      <div className="flex flex-wrap gap-6 border-t border-slate-800/80 px-6 py-3 text-[0.8125rem] text-slate-400">
        <div className="min-w-[180px]">
          <div className="flex justify-between gap-2">
            <span>
              {formatMinutes(totalM)}/{goalH}h • {studyPct.toFixed(0)}% study
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${Math.min(100, studyPct)}%` }}
            />
          </div>
        </div>
        <div className="min-w-[160px]">
          <div>
            {stats?.progress?.elapsedDays ?? 0}/{stats?.progress?.totalTermDays ?? 1} •{" "}
            {timePct.toFixed(0)}% elapsed
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-amber-400/90"
              style={{ width: `${Math.min(100, timePct)}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clapperboard className="h-4 w-4" />
          {stats?.totals?.todaySessionCount ?? 0} sessions today
        </div>
        <div>
          {goalH}h / — goal <span className="text-slate-600">(study days)</span>
        </div>
      </div>
    </header>
  );
}
