---
description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: The examples below include test tasks. Tests are REQUIRED for behavior changes and MUST be
planned unless the spec explicitly documents why no test coverage change is needed.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **API routes**: `pages/api/v1/<resource>/` (handlers and route wiring)
- **Business rules and data access**: `models/*.js`
- **Infra and middleware**: `infra/**`, `utils/*Middleware.js`
- **Frontend UI**: `components/**`, `src/**`, `hooks/**`, `store/**`
- **Tests**: `tests/integration/**` (API), `tests/frontend/**` (React), `tests/helpers/**`
- **Migrations**: `infra/migrations/*.js` (sempre `exports.down = false`)

<!--
  ============================================================================
  IMPORTANT: The tasks below are SAMPLE TASKS for illustration purposes only.

  The /speckit.tasks command MUST replace these with actual tasks based on:
  - User stories from spec.md (with their priorities P1, P2, P3...)
  - Feature requirements from plan.md
  - Entities from data-model.md
  - Endpoints from contracts/

  Tasks MUST be organized by user story so each story can be:
  - Implemented independently
  - Tested independently
  - Delivered as an MVP increment

  DO NOT keep these sample tasks in the generated tasks.md file.
  ============================================================================
-->

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create project structure per implementation plan
- [ ] T002 Confirmar scripts e variaveis de ambiente necessarios para o feature em package.json/.env
- [ ] T003 [P] Definir fixtures, seeds ou dados de teste reutilizaveis para o escopo

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

Examples of foundational tasks (adjust based on your project):

- [ ] T004 Preparar/ajustar migration em infra/migrations/[timestamp]\_[nome].js
- [ ] T005 [P] Aplicar regras de autenticacao/autorizacao (authMiddleware + requirePermission)
- [ ] T006 [P] Garantir padrao de erro via controller.errorHandlers nas rotas novas/alteradas
- [ ] T007 Ajustar models compartilhados necessarios para as user stories
- [ ] T008 Validar contratos de API e formatos de resposta/erro esperados
- [ ] T009 Configurar dados e precondicoes de teste para execucao deterministica

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - [Title] (Priority: P1) 🎯 MVP

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 1 (REQUIRED) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T010 [P] [US1] Teste de integracao do endpoint em tests/integration/api/v1/[resource]/[method].test.js
- [ ] T011 [P] [US1] Teste frontend/hook relacionado em tests/frontend/[area]/[name].test.tsx

### Implementation for User Story 1

- [ ] T012 [P] [US1] Criar/ajustar model em models/[recurso].js
- [ ] T013 [P] [US1] Criar/ajustar schema/form em components/[Area]/[schema].ts
- [ ] T014 [US1] Implementar regra de negocio e validacoes no model (depende de T012)
- [ ] T015 [US1] Implementar endpoint/handler em pages/api/v1/[resource]/[index-ou-id].js
- [ ] T016 [US1] Integrar UI/hook com utils/api.ts ou hooks/useApi.ts
- [ ] T017 [US1] Garantir tratamento de erro e mensagens para fluxo da historia

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 2 (REQUIRED) ⚠️

- [ ] T018 [P] [US2] Teste de integracao do endpoint em tests/integration/api/v1/[resource]/[method].test.js
- [ ] T019 [P] [US2] Teste frontend/hook relacionado em tests/frontend/[area]/[name].test.tsx

### Implementation for User Story 2

- [ ] T020 [P] [US2] Criar/ajustar model em models/[recurso].js
- [ ] T021 [US2] Implementar regra de negocio no model com validacoes necessarias
- [ ] T022 [US2] Implementar endpoint/handler em pages/api/v1/[resource]/[index-ou-id].js
- [ ] T023 [US2] Integrar com componentes/hooks existentes sem duplicar caminho de dados

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - [Title] (Priority: P3)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 3 (REQUIRED) ⚠️

- [ ] T024 [P] [US3] Teste de integracao do endpoint em tests/integration/api/v1/[resource]/[method].test.js
- [ ] T025 [P] [US3] Teste frontend/hook relacionado em tests/frontend/[area]/[name].test.tsx

### Implementation for User Story 3

- [ ] T026 [P] [US3] Criar/ajustar model em models/[recurso].js
- [ ] T027 [US3] Implementar regra de negocio no model com validacoes necessarias
- [ ] T028 [US3] Implementar endpoint/handler em pages/api/v1/[resource]/[index-ou-id].js

**Checkpoint**: All user stories should now be independently functional

---

[Add more user story phases as needed, following the same pattern]

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] TXXX [P] Documentation updates in docs/
- [ ] TXXX Code cleanup and refactoring
- [ ] TXXX Performance optimization across all stories
- [ ] TXXX [P] Cobertura adicional em tests/integration/ e tests/frontend/
- [ ] TXXX Security hardening
- [ ] TXXX Run quickstart.md validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Teste de integracao do endpoint em tests/integration/api/v1/<resource>/<method>.test.js"
Task: "Teste frontend/hook em tests/frontend/<area>/<name>.test.tsx"

# Launch all models for User Story 1 together:
Task: "Criar/ajustar model em models/<entity1>.js"
Task: "Criar/ajustar model em models/<entity2>.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
