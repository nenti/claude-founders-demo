# AlignHQ — Project Management Tool

> 2026-06-18 demo run. Built from a single prompt: *"a project management tool
> that handles the complexity of project management, keeps the decisions clear,
> keeps the documentation, and aligns everyone."*

AlignHQ is a focused project-management app that does four things well:

| Pillar | How AlignHQ delivers it |
|---|---|
| **Handles complexity** | A drag-and-drop **Board** (Backlog → To Do → In Progress → Review → Done) with priorities and assignees, plus an **Overview** dashboard that rolls progress up per project. |
| **Keeps decisions clear** | A **Decision log** in ADR shape — *context → decision → consequences → status* (proposed / accepted / rejected / superseded) — so the "why" never gets lost. |
| **Keeps the documentation** | A lightweight **Docs** space (briefs, runbooks, models) that lives next to the work it describes. |
| **Aligns everyone** | A **Team & Activity** view: who's involved, their open load, and a live activity feed of every task move, decision, and doc change. |

## Stack

- **Zero runtime dependencies.** A single Node.js (`http`) server (`server.js`)
  serves both the JSON REST API and the static SPA in `public/`. Nothing to
  `npm install` at runtime → fast, reproducible buildpack builds.
- **Frontend:** vanilla JS single-page app (`public/app.js`), no framework.
- **State:** in-memory, seeded with demo data on boot, persisted best-effort to
  `data.json`. (On Nyxory the pod filesystem is ephemeral, so a fresh pod
  re-seeds the demo data — swap in a PVC or a database for durable storage.)

## Run locally

```bash
cd 2026-06-18-project-management-tool
node server.js            # → http://localhost:3000
```

Env knobs: `PORT` (default `3000`), `HOST` (default `0.0.0.0`), `DATA_DIR`.

## API

`GET /api/health` · `GET /api/state` ·
`POST|PATCH|DELETE /api/tasks[/:id]` ·
`POST|PATCH|DELETE /api/decisions[/:id]` ·
`POST|PATCH|DELETE /api/docs[/:id]` ·
`GET|POST /api/projects`

## Deploy

Deployed to **Nyxory** as a single HTTP App (Node buildpack, `npm start`),
reachable at its `*.nyxory.app` auto-domain. See the live URL in the deploy
summary.
