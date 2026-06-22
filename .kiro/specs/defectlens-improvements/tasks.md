# Implementation Plan: DefectLens Improvements

## Phase 1 — Close credibility gaps

- [ ] 1. Set up the API test harness
  - Add `vitest` and `supertest` as dev dependencies in `apps/api`
  - Configure an isolated test `DATABASE_URL` and a setup that pushes the Prisma schema and resets data between tests
  - Add a root-level `npm test` script delegating to the API workspace
  - _Requirements: 2.1, 2.6_

- [ ] 2. Add baseline API tests against current behavior
  - Test create-defect validation failure returns field-level errors
  - Test fetching a non-existent defect returns 404
  - Test mock analysis output matches `analysisSchema` and the documented classification rules
  - Test dashboard aggregation counts, coverage percent, and high-risk module ordering
  - _Requirements: 2.2, 2.3, 2.4, 2.5_

- [ ] 3. Persist prevention checklist progress (data + API)
  - Add `preventionProgress String?` to the `Defect` model and run `db push`
  - Add `PATCH /api/defects/:id/prevention` accepting `{ action, done }`, updating the JSON map with `updatedAt`
  - Reconcile prevention progress on analysis regeneration (keep still-existing actions, drop removed)
  - Expose `preventionProgress` and a `{ completed, total }` summary in the serializer
  - Add tests for persistence, reconciliation, and summary computation
  - _Requirements: 1.1, 1.3, 1.4, 1.5_

- [ ] 4. Wire persistent checklist into the defect detail UI
  - Replace local-only checkbox state with calls to the prevention endpoint
  - Render persisted state on load and show a completed/total badge
  - _Requirements: 1.1, 1.2, 1.5_

- [ ] 5. Add defect list filtering, search, and pagination (API)
  - Add a Zod query schema for `status`, `severity`, `module`, `environment`, `q`, `page`, `pageSize`
  - Apply filters and case-insensitive search in the Prisma `where` clause
  - Return a paged envelope `{ items, page, pageSize, total, totalPages }`
  - Add tests for filtering, combined criteria, empty results, and paging metadata
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 8.1, 8.2, 8.3, 8.4_

- [ ] 6. Add filter/search controls and pagination to the defect list UI
  - Update `api.ts` `listDefects` to accept a query object and return the envelope
  - Add filter controls, a search box, a clear-all action, and pager controls
  - Show an explicit empty state when no defects match
  - _Requirements: 3.5, 3.6, 8.3_

## Phase 2 — Governance instrument

- [ ] 7. Add the audit trail model and recording helper
  - Add `DefectEvent` model with a cascade relation to `Defect` and run `db push`
  - Add a `recordEvent` helper that never throws into the request path
  - Record events on create, status change, analyze, prevention update, and delete
  - Add `GET /api/defects/:id/events` returning events newest-first
  - Add tests for event recording on status change and analyze
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 8. Render the audit timeline on the defect detail page
  - Consume `GET /api/defects/:id/events` and render a reverse-chronological timeline
  - _Requirements: 5.4_

- [ ] 9. Add trend metrics to the dashboard (API)
  - Add a tested Monday-start ISO week-bucketing util
  - Extend `GET /api/dashboard` with `createdPerWeek`, `closedPerWeek`, and `openByRootCause`
  - Add tests for the bucketing util and the new aggregations
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 10. Render trend charts on the dashboard UI
  - Add per-week created/closed visualizations and an open-by-root-cause view
  - Show explicit empty states when a series has no data
  - _Requirements: 4.5_

- [ ] 11. Add the release-readiness (CAB pack) export (API)
  - Add `GET /api/release-pack` returning summary metrics and qualifying defects (open AND High/Critical risk)
  - Include root cause, release risk, prevention progress, CAB summary, rollback per defect
  - Handle the no-qualifying-defects case explicitly
  - Add tests for inclusion rules, summary metrics, and the empty case
  - _Requirements: 6.1, 6.2, 6.3, 6.5_

- [ ] 12. Add the release pack view in the UI
  - Add a `/release-pack` print-friendly page with an export/print action
  - _Requirements: 6.4_

## Phase 3 — Engineering hardening

- [ ] 13. Make persistence production-ready
  - Validate `DATABASE_URL` shape at startup in `env.ts` and fail fast on misconfiguration
  - Document and support a Postgres provider for production while keeping SQLite locally
  - Update deployment notes in the README accordingly
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 14. Harden the AI prompt against injection
  - Wrap user-supplied defect fields in explicit untrusted-data delimiters in the prompt
  - Strengthen the system instruction to treat delimited content as data only
  - Confirm output schema validation prevents partial persistence on parse failure
  - Add a test that instruction-like input still yields schema-valid, contract-bound output (mock path)
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

## Phase 4 — Polish and presentation

- [ ] 15. Add a global notification system to the UI
  - Add a `NotificationProvider` and `notify` API wrapping the app
  - Route transient action feedback (success/failure) through toasts that stack, auto-dismiss, and are dismissible
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 16. Add presentation assets and headline metric
  - Capture dashboard, defect-detail-with-analysis, and create-defect screenshots into `docs/screenshots/`
  - Reference screenshots in the README and add a headline outcome metric to the dashboard hero and README
  - _Requirements: 11.1, 11.2, 11.3_
