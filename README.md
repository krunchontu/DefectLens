# DefectLens

AI-assisted defect prevention tracker for root-cause classification, missing UAT scenario generation, preventive delivery actions, and CAB-ready release summaries.

> **Headline metric:** 100% Prevention Coverage — every defect generates root-cause analysis, prevention actions, and UAT scenarios. The dashboard tracks analysis coverage in real time so the team always knows where gaps remain.

## Why This Matters

DefectLens is built around a shift-left delivery mindset: defects are not only tickets to close, they are signals about weak requirements, missed test coverage, release-control gaps, and repeatable prevention opportunities.

## Problem Statement

Delivery teams often track severity, owner, and status, but lose the analysis of why defects repeat. This MVP demonstrates how a Technical BA, Technical PM, UAT Lead, or Product Owner can turn defect triage into better requirements, stronger UAT coverage, and clearer release governance.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, TypeScript, Vite, React Router, plain CSS |
| Backend | Node.js, Express, TypeScript, Zod |
| Database | SQLite, Prisma ORM |
| AI | OpenAI SDK when configured, deterministic mock fallback otherwise |
| Tooling | npm workspaces, concurrently, tsx |

## Local Run Commands

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

API: http://localhost:3001  
Frontend: http://localhost:5173  
Health: http://localhost:3001/api/health

## Environment Variables

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Yes | `file:./dev.db` for local SQLite (resolved under `prisma/`), or a `postgresql://` connection string for production. |
| `OPENAI_API_KEY` | No | Leave blank to use deterministic mock analysis. |
| `PORT` | No | API port. Defaults to `3001`. |
| `VITE_API_BASE_URL` | Production only | Railway API origin for deployed frontend builds. Leave blank locally. |
| `CORS_ORIGIN` | Production only | Vercel frontend origin allowed by the Railway API. |

### Database Provider Strategy

DefectLens uses **SQLite** for local development and **Postgres** for production deployments.

- **Local development**: No extra setup needed. The default `DATABASE_URL=file:./dev.db` in `.env` uses the SQLite provider already configured in `prisma/schema.prisma`.
- **Production (Postgres)**: Set `DATABASE_URL` to your Postgres connection string (e.g. `postgresql://user:pass@host:5432/defectlens`). You must also change the `provider` in `prisma/schema.prisma` from `"sqlite"` to `"postgresql"` before running `prisma migrate` or `prisma db push` against the production database.

The API validates `DATABASE_URL` at startup and will fail fast with a clear error if the variable is missing or has an unrecognized format (must start with `file:`, `postgresql://`, or `postgres://`).

## 3-Minute Demo Workflow

1. Open the dashboard and show total defects, open/critical/closed KPIs, analysis coverage, root-cause mix, and high-risk modules.
2. Open a seeded defect and review the original defect evidence.
3. Generate or regenerate AI analysis and point out the root-cause category.
4. Show missing UAT scenarios and prevention actions as the shift-left output.
5. Copy the CAB summary and explain how it supports release governance.
6. Close with: "This is how I think about defects - not as tickets, but as signals."

## Screenshots

> See [docs/screenshots/README.md](docs/screenshots/README.md) for capture instructions.

### Dashboard

![Dashboard with KPIs, trend charts, and hero metric](docs/screenshots/dashboard.png)

### Defect Detail with AI Analysis

![Defect detail showing root-cause analysis, UAT scenarios, and prevention actions](docs/screenshots/defect-detail-ai-analysis.png)

### Create Defect

![Create defect form](docs/screenshots/create-defect.png)

## Portfolio Positioning

DefectLens demonstrates Business Analyst, Technical PM, UAT, release governance, and full-stack implementation capability in one focused MVP. The key idea is that defect management becomes more valuable when it connects root cause, UAT coverage, preventive action, and release risk.

## Future Improvements

- Add deployment seed tooling for hosted demos.
- Add configurable root-cause taxonomy for different delivery domains.

## Deployment Notes

### Railway API (Postgres)

1. Provision a Postgres add-on (Railway provides one-click Postgres).
2. Set `DATABASE_URL` to the Postgres connection string provided by Railway.
3. Change `provider` in `prisma/schema.prisma` to `"postgresql"` (or maintain a production-specific schema override).
4. Railway should run `npm install && npx prisma db push && npm run build`. Set `PORT`, optional `OPENAI_API_KEY`, and `CORS_ORIGIN` to the Vercel origin.
5. Data persists across deploys — no ephemeral filesystem concerns.

> **Tip:** For quick portfolio demos you can still use SQLite on Railway with a persistent volume attached, but Postgres is recommended for production reliability.

### Vercel Frontend

Deploy `apps/web` as the frontend workspace and set `VITE_API_BASE_URL` to the Railway API origin. Vercel hosts the static React app; the long-running Express API belongs on Railway.

## Disclaimer

All sample data is fictional. The seeded case IDs, modules, workflows, and notes contain no real case data, employer names, government project names, or personal information.
