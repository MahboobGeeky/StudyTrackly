import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";

export function LoginPage() {
  const [email, setEmail] = useState("student@example.com");
  const [name, setName] = useState("Student");
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    try {
      await api("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({ email, displayName: name }),
      });
      localStorage.setItem("athenify_profile", JSON.stringify({ email, name }));
      navigate("/dashboard");
    } catch {
      setErr("Could not reach API. Start the backend (see README).");
    }
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8">
        <div className="mb-6 flex items-center gap-3">
          <img src="/studytrackly-logo.svg" alt="StudyTrackly" className="h-12 w-auto" />
        </div>
        <p className="mb-6 text-sm text-slate-400">
          Local study tracker. Set your profile to continue; all data is stored in the backend
          SQLite database.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-500">Display name</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Email</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
            />
          </div>
          {err && <p className="text-sm text-red-400">{err}</p>}
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-500"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
