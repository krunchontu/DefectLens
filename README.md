# DefectLens

AI-assisted defect prevention tracker for root-cause classification, missing UAT scenario generation, preventive delivery actions, and CAB-ready release summaries.

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
| `DATABASE_URL` | Yes | SQLite path. Local default is `file:./dev.db`, resolved under `prisma/`. |
| `OPENAI_API_KEY` | No | Leave blank to use deterministic mock analysis. |
| `PORT` | No | API port. Defaults to `3001`. |
| `VITE_API_BASE_URL` | Production only | Railway API origin for deployed frontend builds. Leave blank locally. |
| `CORS_ORIGIN` | Production only | Vercel frontend origin allowed by the Railway API. |

## 3-Minute Demo Workflow

1. Open the dashboard and show total defects, open/critical/closed KPIs, analysis coverage, root-cause mix, and high-risk modules.
2. Open a seeded defect and review the original defect evidence.
3. Generate or regenerate AI analysis and point out the root-cause category.
4. Show missing UAT scenarios and prevention actions as the shift-left output.
5. Copy the CAB summary and explain how it supports release governance.
6. Close with: "This is how I think about defects - not as tickets, but as signals."

## Screenshots

TODO: Add real screenshots after running the app locally.
- docs/screenshots/dashboard.png
- docs/screenshots/defect-detail-ai-analysis.png
- docs/screenshots/create-defect.png

## Portfolio Positioning

DefectLens demonstrates Business Analyst, Technical PM, UAT, release governance, and full-stack implementation capability in one focused MVP. The key idea is that defect management becomes more valuable when it connects root cause, UAT coverage, preventive action, and release risk.

## Future Improvements

- Persist prevention-checklist completion state per defect.
- Add API tests for validation, not-found handling, and mock analysis.
- Add deployment seed tooling for hosted demos.
- Add exportable release-readiness reports.
- Add configurable root-cause taxonomy for different delivery domains.

## Deployment Notes

### Railway API

Railway should run `npm install` and `npm run build`. Set `DATABASE_URL`, optional `OPENAI_API_KEY`, `PORT`, and `CORS_ORIGIN` to the Vercel origin. SQLite on Railway uses an ephemeral filesystem unless a persistent volume is attached, so use a volume or reseed after deployment for portfolio demos.

### Vercel Frontend

Deploy `apps/web` as the frontend workspace and set `VITE_API_BASE_URL` to the Railway API origin. Vercel hosts the static React app; the long-running Express API belongs on Railway.

## Disclaimer

All sample data is fictional. The seeded case IDs, modules, workflows, and notes contain no real case data, employer names, government project names, or personal information.
