import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Header } from "@/components/Header";
import type { AppOutletContext } from "@/layouts/outletContext";
import { api } from "@/lib/api";
import type { DataRoomFile, Term } from "@/types";

export function DataRoomPage() {
  const { stats, reload } = useOutletContext<AppOutletContext>();
  const [term, setTerm] = useState<Term | null>(null);
  const [files, setFiles] = useState<DataRoomFile[]>([]);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("https://");
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    const t = await api<Term | null>("/api/terms/active");
    setTerm(t);
    if (!t) return;
    const f = await api<DataRoomFile[]>(`/api/data-room?termId=${t.id}`);
    setFiles(f);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!term || !name.trim() || !url.trim()) return;
    await api("/api/data-room", {
      method: "POST",
      body: JSON.stringify({ termId: term.id, name: name.trim(), url: url.trim(), note }),
    });
    setName("");
    setUrl("https://");
    setNote("");
    await load();
    await reload();
  }

  async function remove(id: string) {
    await api(`/api/data-room/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <>
      <Header title="Data Room" stats={stats} />
      <main className="flex-1 space-y-6 overflow-auto p-6">
        <p className="text-sm text-slate-400">
          Store links to notes, drive folders, or resources for this term.
        </p>
        <form
          onSubmit={add}
          className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 md:grid-cols-2"
        >
          <div className="md:col-span-2">
            <label className="text-xs text-slate-500">Name</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-slate-500">URL</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-slate-500">Note</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            Add link
          </button>
        </form>

        <ul className="space-y-2">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3"
            >
              <div>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-blue-400 hover:underline"
                >
                  {f.name}
                </a>
                {f.note && <p className="text-xs text-slate-500">{f.note}</p>}
              </div>
              <button
                type="button"
                onClick={() => void remove(f.id)}
                className="text-xs text-red-400 hover:underline"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
