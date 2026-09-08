import { randomUUID } from "crypto";

export type Task = {
  id: string;
  title: string;
  done: boolean;
  createdAt: string;
};

// A module-level store persists for the lifetime of the server process, which
// is sufficient for a demo. Using a global guards against duplicate state when
// Next.js reloads modules during development.
type TaskStore = { tasks: Task[] };

const globalForTasks = globalThis as unknown as { __taskStore?: TaskStore };

function seed(): Task[] {
  const now = Date.now();
  return [
    {
      id: randomUUID(),
      title: "Read the project README",
      done: true,
      createdAt: new Date(now - 1000 * 60 * 60).toISOString(),
    },
    {
      id: randomUUID(),
      title: "Run the dev server with npm run dev",
      done: false,
      createdAt: new Date(now - 1000 * 60 * 30).toISOString(),
    },
    {
      id: randomUUID(),
      title: "Ship something great",
      done: false,
      createdAt: new Date(now).toISOString(),
    },
  ];
}

const store: TaskStore = globalForTasks.__taskStore ?? { tasks: seed() };
globalForTasks.__taskStore = store;

export function listTasks(): Task[] {
  return [...store.tasks].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function createTask(title: string): Task {
  const task: Task = {
    id: randomUUID(),
    title,
    done: false,
    createdAt: new Date().toISOString(),
  };
  store.tasks.push(task);
  return task;
}

export function updateTask(
  id: string,
  patch: Partial<Pick<Task, "title" | "done">>,
): Task | undefined {
  const task = store.tasks.find((t) => t.id === id);
  if (!task) return undefined;
  if (typeof patch.title === "string") task.title = patch.title;
  if (typeof patch.done === "boolean") task.done = patch.done;
  return task;
}

export function deleteTask(id: string): boolean {
  const before = store.tasks.length;
  store.tasks = store.tasks.filter((t) => t.id !== id);
  return store.tasks.length < before;
}
