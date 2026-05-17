<!--
Sync Impact Report
- Version change: template draft -> 1.0.0
- Modified principles:
  - Template Principle 1 -> I. Security and Session Integrity First
  - Template Principle 2 -> II. API and Model Boundary Discipline
  - Template Principle 3 -> III. Test-First Delivery and Regression Safety
  - Template Principle 4 -> IV. Data Integrity and Migration Safety
  - Template Principle 5 -> V. Observability and Performance Accountability
- Added sections:
  - Technical Standards and Constraints
  - Workflow and Quality Gates
- Removed sections:
  - None
- Templates requiring updates:
  - .specify/templates/plan-template.md: updated (constitution gate checklist made explicit)
  - .specify/templates/spec-template.md: no changes required (already enforces scenarios/testing)
  - .specify/templates/tasks-template.md: updated (tests no longer optional by default)
  - .specify/templates/commands/*.md: pending (directory not present in repository)
- Follow-up TODOs:
  - None
-->

# Espaco Dialogico Constitution

## Core Principles

### I. Security and Session Integrity First

All authenticated endpoints and sensitive client flows MUST enforce the established auth stack:
JWT validation, session version checks, and role/resource authorization middleware. Any change to
authentication, authorization, or session lifecycle MUST include explicit abuse-case validation and
test coverage for invalid tokens, stale sessions, and role violations.
Rationale: The system handles patient and financial data and cannot trade security for velocity.

### II. API and Model Boundary Discipline

Business rules and persistence concerns MUST live in `models/**`; API routes MUST remain thin and
use centralized error handling conventions. New backend capabilities MUST follow `pages/api/v1/**`
routing conventions and preserve middleware layering for permission enforcement.
Rationale: Consistent boundaries reduce regression risk, keep security checks centralized, and
maintain predictable maintenance paths.

### III. Test-First Delivery and Regression Safety

Changes to backend logic, permission checks, session behavior, data models, or critical UI flows
MUST be accompanied by failing-first tests and a passing full test run before completion. Test
helpers and fixture setup conventions defined in the repository guidance MUST be followed exactly.
Rationale: This project evolves through iterative fixes and requires durable safeguards against
security and behavior regressions.

### IV. Data Integrity and Migration Safety

Schema and data changes MUST be implemented through project migration tooling, with naming and
field conventions preserved. Migrations MUST be forward-only (`exports.down = false`) and MUST be
written to minimize operational risk, including explicit handling for constraints and defaults.
Rationale: Clinical and financial records require consistency and auditable evolution.

### V. Observability and Performance Accountability

New features and fixes MUST preserve existing monitoring/debuggability patterns and avoid hidden
performance regressions in fetch, caching, and scheduling workflows. Where performance-sensitive
paths are touched, validation evidence (tests, measurements, or targeted assertions) MUST be
included in delivery artifacts.
Rationale: The application depends on reliable operational behavior for day-to-day clinic workflows.

## Technical Standards and Constraints

- Backend route and model files MUST remain JavaScript where the codebase standard requires it;
  do not perform opportunistic language migrations during feature work.
- Frontend additions MUST use existing hooks, state, and API utilities instead of parallel ad-hoc
  data paths for the same capability.
- Role names and permission semantics MUST stay canonical (`admin`, `secretaria`, `terapeuta`) and
  access restrictions for therapist-scoped data MUST be preserved.
- API behavior MUST maintain stable contracts unless an explicitly approved breaking change plan is
  documented in spec, plan, and tasks.

## Workflow and Quality Gates

1. Specification and plan artifacts MUST identify constitution impacts before implementation starts.
2. Implementation work MUST map to independent user stories and preserve traceability in tasks.
3. Every completed change set MUST include:
   - Updated/added tests for impacted behavior.
   - Validation that standard test command(s) pass for the scope.
   - Documentation updates when behavior, workflow, or operations changed.
4. Reviews MUST explicitly confirm security, permission scope, data integrity, and regression
   safeguards before approval.

## Governance

This constitution is the highest-priority project rule set for delivery behavior. In case of
conflict, this constitution overrides ad-hoc local practices.

Amendment process:

1. Propose the change with explicit rationale and impact.
2. Update constitution text and all impacted templates/docs in the same change set.
3. Record a Sync Impact Report at the top of this file.

Versioning policy (semantic):

1. MAJOR: Incompatible governance changes or principle removals/redefinitions.
2. MINOR: New principle/section or materially expanded mandatory guidance.
3. PATCH: Clarifications, wording improvements, and non-semantic refinements.

Compliance review expectations:

1. Every feature plan MUST pass a documented constitution check before implementation.
2. Every review MUST verify that tests, security controls, and migration rules remain compliant.
3. Exceptions MUST be explicitly documented with rationale and follow-up actions.

**Version**: 1.0.0 | **Ratified**: 2026-05-17 | **Last Amended**: 2026-05-17
