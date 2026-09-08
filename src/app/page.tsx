"use client";

import { useEffect, useMemo, useState } from "react";

type Task = {
  id: string;
  title: string;
  done: boolean;
  createdAt: string;
};

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = useMemo(
    () => tasks.filter((t) => !t.done).length,
    [tasks],
  );

  async function refresh() {
    setError(null);
    try {
      const res = await fetch("/api/tasks");
      if (!res.ok) throw new Error(`Failed to load tasks (${res.status})`);
      const data = (await res.json()) as { tasks: Task[] };
      setTasks(data.tasks);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/tasks");
        if (!res.ok) throw new Error(`Failed to load tasks (${res.status})`);
        const data = (await res.json()) as { tasks: Task[] };
        if (active) setTasks(data.tasks);
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : "Something went wrong");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });
      if (!res.ok) throw new Error(`Failed to add task (${res.status})`);
      const data = (await res.json()) as { task: Task };
      setTasks((prev) => [...prev, data.task]);
      setTitle("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleTask(task: Task) {
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)),
    );
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: !task.done }),
      });
      if (!res.ok) throw new Error("Failed to update task");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      refresh();
    }
  }

  async function removeTask(id: string) {
    const prev = tasks;
    setTasks((current) => current.filter((t) => t.id !== id));
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete task");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setTasks(prev);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white text-zinc-900 dark:from-zinc-950 dark:via-zinc-950 dark:to-black dark:text-zinc-100">
      <main className="mx-auto flex w-full max-w-xl flex-col gap-8 px-6 py-16">
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white shadow-lg shadow-indigo-600/30">
              ✓
            </span>
            <h1 className="text-3xl font-semibold tracking-tight">
              Task Manager
            </h1>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            A small full-stack demo powered by Next.js API routes.{" "}
            {loading
              ? "Loading…"
              : `${remaining} of ${tasks.length} task${
                  tasks.length === 1 ? "" : "s"
                } remaining.`}
          </p>
        </header>

        <form onSubmit={addTask} className="flex gap-2">
          <input
            aria-label="New task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a new task…"
            className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-900"
          />
          <button
            type="submit"
            disabled={submitting || !title.trim()}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Adding…" : "Add"}
          </button>
        </form>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
          >
            {error}
          </div>
        )}

        <ul className="flex flex-col gap-2">
          {!loading && tasks.length === 0 && (
            <li className="rounded-lg border border-dashed border-zinc-300 px-4 py-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              No tasks yet. Add your first one above.
            </li>
          )}
          {tasks.map((task) => (
            <li
              key={task.id}
              className="group flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              <button
                onClick={() => toggleTask(task)}
                aria-label={task.done ? "Mark as not done" : "Mark as done"}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                  task.done
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-zinc-300 dark:border-zinc-600"
                }`}
              >
                {task.done && <span className="text-xs">✓</span>}
              </button>
              <span
                className={`flex-1 text-sm ${
                  task.done
                    ? "text-zinc-400 line-through dark:text-zinc-500"
                    : ""
                }`}
              >
                {task.title}
              </span>
              <button
                onClick={() => removeTask(task.id)}
                aria-label="Delete task"
                className="rounded-md px-2 py-1 text-xs text-zinc-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-950/40"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
