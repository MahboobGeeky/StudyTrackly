import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setAuth, type AuthUser } from "@/lib/auth";

export function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) {
      navigate("/signin?error=missing_token", { replace: true });
      return;
    }
    const params = new URLSearchParams(hash);
    const token = params.get("token");
    const userRaw = params.get("user");
    if (!token || !userRaw) {
      navigate("/signin?error=missing_token", { replace: true });
      return;
    }
    try {
      const user = JSON.parse(decodeURIComponent(userRaw)) as AuthUser;
      setAuth(token, user);
      window.history.replaceState(null, "", window.location.pathname);
      queueMicrotask(() => navigate("/dashboard", { replace: true }));
    } catch {
      navigate("/signin?error=invalid_callback", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-slate-950 px-4 text-slate-400">
      Signing you in…
    </div>
  );
}
