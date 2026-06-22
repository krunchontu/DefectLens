# Requirements: DefectLens Improvements

## Introduction

DefectLens is an AI-assisted defect prevention tracker positioned for Technical BAs, Technical PMs, UAT Leads, and release governance reviewers. The current MVP delivers the core narrative ("defects as delivery signals") but has gaps that a demanding PM would catch within minutes: non-persistent prevention progress, no automated tests, no filtering, no trend metrics, no audit trail, and ephemeral production storage.

This spec defines a phased set of improvements that turn DefectLens from a working CRUD MVP into a defensible, governance-grade delivery quality tool. Each requirement is written so it can be implemented and verified independently, allowing step-by-step delivery.

## Glossary

- **CAB**: Change Advisory Board, the release governance forum that approves changes.
- **Prevention action**: A concrete preventive delivery step generated from a defect's root-cause analysis.
- **Prevention progress**: The completion state of each prevention action for a defect.
- **Analysis coverage**: The percentage of defects that have a generated root-cause analysis.
- **Root-cause category**: One of the fixed taxonomy values classifying why a defect occurred.

## Requirements

### Requirement 1: Persist prevention checklist progress

**User Story:** As a UAT Lead, I want the prevention checklist state to persist, so that I can track which preventive actions are complete across sessions and reviewers.

#### Acceptance Criteria

1. WHEN a user toggles a prevention action checkbox on the defect detail page THEN the system SHALL persist the new completion state to the backend.
2. WHEN a user reloads the defect detail page THEN the system SHALL display the previously persisted completion state for each prevention action.
3. WHEN a prevention action's completion state is persisted THEN the system SHALL record the time the state last changed.
4. WHEN AI analysis is regenerated for a defect THEN the system SHALL reconcile prevention progress so that previously completed actions that still exist remain marked complete and removed actions are discarded.
5. WHEN the defect detail page renders prevention progress THEN the system SHALL show a summary count of completed versus total prevention actions.

### Requirement 2: Automated test coverage for the API

**User Story:** As a Technical PM, I want the application to have automated tests, so that I can trust the delivery quality of a tool that itself preaches delivery quality.

#### Acceptance Criteria

1. WHEN the test suite runs THEN the system SHALL execute via a single documented command from the repository root.
2. WHEN a defect is created with invalid input THEN the test suite SHALL assert a validation error response with field-level details.
3. WHEN a request targets a non-existent defect THEN the test suite SHALL assert a 404 not-found response.
4. WHEN mock analysis is generated for a defect THEN the test suite SHALL assert the output matches the analysis schema and the expected root-cause classification rules.
5. WHEN the dashboard aggregation runs over known seed-like data THEN the test suite SHALL assert the computed counts, coverage percentage, and high-risk module ordering are correct.
6. WHEN tests run in CI or locally THEN the system SHALL use an isolated test database that does not affect development data.

### Requirement 3: Defect list filtering and search

**User Story:** As a Technical BA, I want to filter and search the defect list, so that I can focus on a specific slice of defects such as open criticals in UAT.

#### Acceptance Criteria

1. WHEN a user requests defects with a status filter THEN the system SHALL return only defects matching that status.
2. WHEN a user requests defects with severity, module, or environment filters THEN the system SHALL return only defects matching all supplied filters.
3. WHEN a user supplies a free-text search term THEN the system SHALL return defects whose title, module, or affected case IDs contain the term, case-insensitively.
4. WHEN a user combines multiple filters and a search term THEN the system SHALL apply all criteria together.
5. WHEN no defects match the supplied criteria THEN the system SHALL return an empty result and the UI SHALL show an explicit empty state.
6. WHEN filters are applied in the UI THEN the system SHALL reflect the active filters in a way that can be cleared in one action.

### Requirement 4: Trend metrics over time

**User Story:** As a Technical PM, I want to see defect trends over time, so that I can judge whether delivery quality is improving release over release.

#### Acceptance Criteria

1. WHEN the dashboard loads THEN the system SHALL provide a time series of defects created per week over a recent window.
2. WHEN the dashboard loads THEN the system SHALL provide a time series of defects closed per week over the same window.
3. WHEN the dashboard loads THEN the system SHALL provide the count of currently open defects grouped by root-cause category.
4. WHEN trend data is computed THEN the system SHALL bucket defects by a consistent week boundary.
5. WHEN there is no data in the window THEN the system SHALL return an empty series and the UI SHALL show an explicit empty state.

### Requirement 5: Defect audit trail

**User Story:** As a release governance reviewer, I want an audit trail of defect changes, so that I can evidence who changed what and when during a release.

#### Acceptance Criteria

1. WHEN a defect's status changes THEN the system SHALL record an audit event capturing the change, including previous and new values and a timestamp.
2. WHEN AI analysis is generated or regenerated for a defect THEN the system SHALL record an audit event for the analysis run.
3. WHEN prevention progress changes for a defect THEN the system SHALL record an audit event.
4. WHEN a user views a defect THEN the system SHALL display the audit events for that defect in reverse chronological order.
5. WHEN an audit event is recorded THEN the system SHALL NOT block or fail the primary operation if audit recording encounters a non-critical error.

### Requirement 6: Release-readiness (CAB pack) export

**User Story:** As a release governance reviewer, I want to export a release-readiness pack, so that I can take a single governance artifact into a CAB meeting.

#### Acceptance Criteria

1. WHEN a user requests a release-readiness pack THEN the system SHALL include all open and high-or-critical-risk defects.
2. WHEN the pack is generated THEN the system SHALL include for each included defect its root cause, release risk, prevention progress, CAB summary, and rollback consideration.
3. WHEN the pack is generated THEN the system SHALL include summary metrics such as total included defects, risk distribution, and overall analysis coverage.
4. WHEN a user exports the pack THEN the system SHALL produce a portable output suitable for sharing or printing.
5. WHEN no defects qualify for the pack THEN the system SHALL produce a pack that clearly states no qualifying defects were found.

### Requirement 7: Production-grade persistence

**User Story:** As a Technical PM, I want production data to persist reliably, so that a deployed demo or pilot does not lose data on redeploy.

#### Acceptance Criteria

1. WHEN the application runs locally THEN the system SHALL continue to use SQLite with no additional setup.
2. WHEN the application runs in production THEN the system SHALL support a persistent database via a configurable connection string.
3. WHEN the database provider changes between environments THEN the system SHALL require no code changes beyond configuration.
4. WHEN the production database configuration is missing or invalid THEN the system SHALL fail fast with a clear error at startup.

### Requirement 8: API pagination

**User Story:** As a developer, I want the defect list endpoint to paginate, so that the tool remains responsive as defect volume grows.

#### Acceptance Criteria

1. WHEN a user requests defects without paging parameters THEN the system SHALL return a bounded default page size.
2. WHEN a user requests a specific page THEN the system SHALL return only that page of results.
3. WHEN the system returns a page THEN the system SHALL include total count and paging metadata sufficient for the UI to navigate.
4. WHEN pagination is combined with filters and search THEN the system SHALL apply filtering before paging and report totals for the filtered set.

### Requirement 9: AI prompt-injection hardening

**User Story:** As a Technical PM, I want user-supplied defect text to be handled safely in AI prompts, so that crafted input cannot hijack the analysis output.

#### Acceptance Criteria

1. WHEN user-supplied defect fields are sent to the AI provider THEN the system SHALL clearly delimit user content as untrusted data within the prompt.
2. WHEN the AI provider returns a response THEN the system SHALL validate it against the analysis schema before persisting.
3. WHEN the AI response fails schema validation THEN the system SHALL return a clear error and SHALL NOT persist partial analysis.
4. WHEN user content contains instruction-like text THEN the system SHALL still produce output constrained to the defined output contract.

### Requirement 10: Consistent error and notification UX

**User Story:** As any user, I want consistent feedback when actions succeed or fail, so that the application feels reliable rather than broken.

#### Acceptance Criteria

1. WHEN an API request fails THEN the UI SHALL present the failure through a consistent notification mechanism.
2. WHEN an action such as analysis, status change, or export succeeds THEN the UI SHALL present a consistent success confirmation.
3. WHEN a notification is shown THEN the system SHALL allow it to be dismissed or auto-dismiss after a short interval.
4. WHEN multiple notifications occur THEN the system SHALL present them without overwriting each other.

### Requirement 11: Portfolio presentation assets

**User Story:** As a portfolio reviewer, I want clear visual documentation, so that I can understand the product without running it locally.

#### Acceptance Criteria

1. WHEN a reviewer opens the README THEN the system SHALL present screenshots of the dashboard, defect detail with AI analysis, and defect creation.
2. WHEN a reviewer reads the README THEN the system SHALL present a concise headline outcome metric that anchors the product value.
3. WHEN presentation assets are added THEN the system SHALL store them in a documented location within the repository.
