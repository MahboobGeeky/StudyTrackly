import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Header } from "@/components/Header";
import type { AppOutletContext } from "@/layouts/outletContext";
import { api } from "@/lib/api";
import { coursePillClass } from "@/lib/courseColors";
import type { Course, Term } from "@/types";

const COLORS = ["blue", "yellow", "orange", "green", "purple"];

export function CoursesPage() {
  const { stats, reload } = useOutletContext<AppOutletContext>();
  const [term, setTerm] = useState<Term | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState("blue");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("blue");

  const load = useCallback(async () => {
    const t = await api<Term | null>("/api/terms/active");
    setTerm(t);
    if (!t) return;
    const cs = await api<Course[]>(`/api/courses?termId=${t.id}`);
    setCourses(cs);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!term || !name.trim()) return;
    await api<Course>("/api/courses", {
      method: "POST",
      body: JSON.stringify({ termId: term.id, name: name.trim(), color }),
    });
    setName("");
    await load();
    await reload();
  }

  async function remove(id: string) {
    await api(`/api/courses/${id}`, { method: "DELETE" });
    await load();
    await reload();
  }

  function startEdit(c: Course) {
    setEditingId(c.id);
    setEditName(c.name);
    setEditColor(c.color);
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId || !editName.trim()) return;
    await api(`/api/courses/${editingId}`, {
      method: "PATCH",
      body: JSON.stringify({ name: editName.trim(), color: editColor }),
    });
    setEditingId(null);
    await load();
    await reload();
  }

  return (
    <>
      <Header title="Courses" stats={stats} />
      <main className="flex-1 space-y-6 overflow-auto p-6">
        <form
          onSubmit={add}
          className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4"
        >
          <div>
            <label className="text-xs text-slate-500">New course name</label>
            <input
              className="mt-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. DSA"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Color tag</label>
            <select
              className="mt-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            >
              {COLORS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            Add course
          </button>
        </form>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
            >
              {editingId === c.id ? (
                <form onSubmit={saveEdit} className="space-y-3">
                  <input
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                  <select
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                  >
                    {COLORS.map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`rounded-full border px-3 py-1 text-sm ${coursePillClass(c.color)}`}
                  >
                    {c.name}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(c)}
                      className="text-xs text-blue-400 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(c.id)}
                      className="text-xs text-red-400 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        {!term && (
          <p className="text-sm text-slate-500">
            No active term. Create one under Term Configuration.
          </p>
        )}
      </main>
    </>
  );
}
