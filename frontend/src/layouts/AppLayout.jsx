import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { api } from "@/lib/api";
import { clearAuth, getAuthServerSnapshot, getAuthSnapshot, getToken, subscribeAuth } from "@/lib/auth";

export function AppLayout() {
  const [settings, setSettings] = useState(null);
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();
  const authed = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getAuthServerSnapshot);

  const load = useCallback(async () => {
    try {
      if (!getToken()) {
        setSettings(null);
        setStats(null);
        return;
      }
      const [s, st] = await Promise.all([
        api("/api/settings"),
        api("/api/stats/dashboard"),
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
  }, [load, authed]);

  const ctx = { stats, reload: load, settings };

  return (
    <div className="flex min-h-full">
      <Sidebar
        email={settings?.email ?? "student@example.com"}
        onLogout={() => {
          clearAuth();
          navigate("/signin");
        }}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Outlet context={ctx} />
      </div>
    </div>
  );
}
