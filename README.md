# test2121 — Task Manager

A small full-stack **Task Manager** built with [Next.js](https://nextjs.org) (App Router),
React 19, TypeScript, and Tailwind CSS. It demonstrates an end-to-end flow: a polished UI
that talks to REST API routes backed by an in-memory store.

## Features

- List, create, toggle, and delete tasks
- REST API under `/api/tasks`
- Server-side in-memory data store (`src/lib/tasks.ts`)
- Modern, responsive UI with light/dark support

## Getting started

```bash
npm ci      # install pinned dependencies
npm run dev # start the dev server on http://localhost:3000
```

Then open [http://localhost:3000](http://localhost:3000).

## API

| Method   | Path              | Description            |
| -------- | ----------------- | ---------------------- |
| `GET`    | `/api/tasks`      | List all tasks         |
| `POST`   | `/api/tasks`      | Create a task          |
| `PATCH`  | `/api/tasks/:id`  | Update title / `done`  |
| `DELETE` | `/api/tasks/:id`  | Delete a task          |

Example:

```bash
curl -s http://localhost:3000/api/tasks
curl -s -X POST http://localhost:3000/api/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"My new task"}'
```

## Scripts

| Script          | Description                     |
| --------------- | ------------------------------- |
| `npm run dev`   | Start the development server    |
| `npm run build` | Production build                |
| `npm run start` | Serve the production build      |
| `npm run lint`  | Run ESLint                      |

## Cloud Agent environment

This repository is configured for Cursor Cloud Agents via
[`.cursor/environment.json`](.cursor/environment.json): dependencies install with
`npm ci`, and the dev server runs as a persistent terminal (`npm run dev`).
