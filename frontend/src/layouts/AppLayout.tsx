import { useCallback, useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { api } from "@/lib/api";
import type { AppOutletContext } from "@/layouts/outletContext";
import type { DashboardStats, UserSettings } from "@/types";

export function AppLayout() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      const [s, st] = await Promise.all([
        api<UserSettings>("/api/settings"),
        api<DashboardStats>("/api/stats/dashboard"),
      ]);
      setSettings(s);
      setStats(st);
    } catch {
      setSettings(null);
      setStats(null);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const ctx: AppOutletContext = { stats, reload: load, settings };

  return (
    <div className="flex min-h-full">
      <Sidebar
        email={settings?.email ?? "student@example.com"}
        onLogout={() => {
          localStorage.removeItem("athenify_profile");
          navigate("/login");
        }}
      />
      <div className="flex min-h-full min-w-0 flex-1 flex-col">
        <Outlet context={ctx} />
      </div>
    </div>
  );
}
