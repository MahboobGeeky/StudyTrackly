import {
  BookOpen,
  Calendar,
  Database,
  GraduationCap,
  LayoutDashboard,
  Settings,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/sessions", label: "Sessions", icon: Users },
  { to: "/courses", label: "Courses", icon: BookOpen },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/term", label: "Term", icon: GraduationCap },
  { to: "/data-room", label: "Data Room", icon: Database },
  { to: "/trophies", label: "Trophies", icon: Trophy },
  { to: "/term-config", label: "Term Config.", icon: Sparkles },
  { to: "/settings", label: "Settings", icon: Settings },
];

type Props = {
  email: string;
  onLogout: () => void;
};

export function Sidebar({ email, onLogout }: Props) {
  return (
    <aside className="flex w-[17rem] shrink-0 flex-col border-r border-slate-800 bg-slate-950/80">
      <div className="border-b border-slate-800 p-5">
        <div className="flex items-center gap-3">
          <img
            src="/studytrackly-logo.svg"
            alt="StudyTrackly"
            className="h-10 w-auto"
          />
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[0.9375rem] transition-colors",
                isActive
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200",
              ].join(" ")
            }
          >
            <Icon className="h-[1.125rem] w-[1.125rem] shrink-0 opacity-80" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 text-[0.75rem] font-medium">
            {email.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.8125rem] text-slate-400">{email}</p>
            <button
              type="button"
              onClick={onLogout}
              className="text-[0.8125rem] text-slate-500 hover:text-slate-300"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
