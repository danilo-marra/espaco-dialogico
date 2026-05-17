# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript + JavaScript, Node.js 22.x, React 18, Next.js (pages router)

**Primary Dependencies**: next-connect, pg, swr, axios, react-hook-form, zod, redux-toolkit, radix-ui, sonner

**Storage**: PostgreSQL (Docker em desenvolvimento, conexao via `infra/database.js`)

**Testing**: Jest (`npm run test`, `npm run test:frontend`, `npm run test:single`)

**Target Platform**: Aplicacao web Next.js (desktop e mobile browsers)

**Project Type**: Web application full-stack (Next.js frontend + API routes)

**Performance Goals**: Preservar UX fluida em dashboards, fetches e fluxos de agendamento sem regressao perceptivel

**Constraints**: Manter middleware de auth/roles, convencoes de models/api routes e migrations forward-only

**Scale/Scope**: Sistema de gestao clinica (agendamentos, pacientes, terapeutas, sessoes e financeiro)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- Security and session integrity impact identified (auth, session versioning, role boundaries)
- API/model boundary adherence documented (`pages/api/v1/**` + `models/**` responsibilities)
- Test strategy includes fail-first coverage for all behavior and regression risks in scope
- Data and migration impacts documented, including forward-only migration requirements
- Observability/performance impact assessed for touched critical flows

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
components/
hooks/
infra/
models/
pages/
public/
src/
store/
styles/
tests/
├── frontend/
├── helpers/
├── integration/
│   └── api/v1/
├── infra/
├── mocks/
└── orchestrator.js
utils/
docs/
```

**Structure Decision**: Aplicacao web full-stack em um unico repositorio Next.js, com API em `pages/api/v1/**`, regras de negocio em `models/**`, infraestrutura em `infra/**`, UI em `components/**`/`src/**`, e testes separados entre `tests/integration/**` e `tests/frontend/**`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |
