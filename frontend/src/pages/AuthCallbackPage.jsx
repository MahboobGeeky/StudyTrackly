import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { clearAuth, setAuth } from "@/lib/auth";

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
    if (!token) {
      navigate("/signin?error=missing_token", { replace: true });
      return;
    }

    async function completeSignIn() {
      try {
        const user = await api("/api/settings", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAuth(token, user);
        window.history.replaceState(null, "", window.location.pathname);
        navigate("/dashboard", { replace: true });
      } catch {
        clearAuth();
        navigate("/signin?error=invalid_callback", { replace: true });
      }
    }

    void completeSignIn();
  }, [navigate]);

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-slate-950 px-4 text-slate-400">
      Signing you in…
    </div>
  );
}
