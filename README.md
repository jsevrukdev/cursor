# Convex Tasks

A minimal real-time tasks app used to demonstrate a full-stack development
environment: a **Vite + React + TypeScript** frontend backed by a **Convex**
reactive backend.

- Add, complete, and delete tasks
- Updates render in real time via Convex reactive queries
- Data persists in the Convex backend across reloads

## Tech stack

| Layer    | Technology                          |
| -------- | ----------------------------------- |
| Frontend | Vite, React 19, TypeScript          |
| Backend  | Convex (queries, mutations, schema) |
| Lint     | oxlint                              |

## Prerequisites

- Node.js 18+ (developed on Node 22)
- npm 8+

## Getting started

Install dependencies:

```bash
npm install
```

Provision the Convex backend. This project uses Convex
[agent mode](https://docs.convex.dev/cli/agent-mode) so it runs a local,
anonymous Convex deployment without requiring a login. Running the command below
downloads the local backend, creates the deployment, and writes
`CONVEX_DEPLOYMENT` / `VITE_CONVEX_URL` into `.env.local`:

```bash
CONVEX_AGENT_MODE=anonymous npm run setup:backend
```

Then run the two dev processes in separate terminals:

```bash
# Terminal 1 — Convex backend (local, reactive)
CONVEX_AGENT_MODE=anonymous npm run dev:backend

# Terminal 2 — Vite dev server
npm run dev
```

Open http://127.0.0.1:5173 and start adding tasks.

## Scripts

| Script                  | Description                                       |
| ----------------------- | ------------------------------------------------- |
| `npm run dev`           | Start the Vite dev server                         |
| `npm run dev:backend`   | Start the Convex backend (watch mode)             |
| `npm run setup:backend` | Provision the backend and push functions once     |
| `npm run build`         | Type-check and build the production frontend       |
| `npm run lint`          | Lint the codebase with oxlint                      |

## Project layout

```
convex/            Convex backend (schema + functions)
  schema.ts        Database schema and indexes
  tasks.ts         Task queries and mutations
  _generated/      Convex-generated types and API (committed)
src/               React frontend
  main.tsx         App entry + ConvexProvider
  App.tsx          Tasks UI
.cursor/           Cloud Agent environment configuration
```

## Cloud Agent environment

`.cursor/environment.json` configures a Cursor Cloud Agent environment:

- `install` installs dependencies and provisions the anonymous Convex backend
- `terminals` run the Convex backend and the Vite dev server on each boot
