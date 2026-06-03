# Implementation Plan: Criação e edição de agendamentos

**Branch**: `001-criacao-edicao-agendamentos` | **Date**: 2026-05-18 | **Spec**: `specs/001-criacao-edicao-agendamentos/spec.md`

**Input**: Feature specification from `specs/001-criacao-edicao-agendamentos/spec.md`

## Summary

Estabilizar os fluxos de criação, edição e consulta de agendamentos, com foco em integridade de API, persistência de flags `sessaoRealizada`/`falta`, consistência de autorização e cobertura de regressão para endpoints de recorrência e listagem.

## Technical Context

**Language/Version**: TypeScript + JavaScript, Node.js 24.x, React 18, Next.js (pages router)

**Primary Dependencies**: next-connect, pg, swr, axios, react-hook-form, zod, redux-toolkit, radix-ui, sonner

**Storage**: PostgreSQL via `infra/database.js`

**Testing**: Jest (`npm run test`, `npx jest --runInBand --verbose ...`)

**Target Platform**: Aplicação web Next.js (desktop e mobile)

**Project Type**: Full-stack web app em um único repositório

**Performance Goals**:

- preservar atualização visual correta na agenda após PUT
- evitar regressões de latência perceptível em fluxos de agendamento/recorrência

**Constraints**:

- manter boundary API em `pages/api/v1/**` e regra de negócio em `models/**`
- manter middleware de autorização atual (`authMiddleware`, `requirePermission`, camada terapeuta)
- manter compatibilidade de contrato de recorrência (`updateAllRecurrences` e variação legada)
- migrations forward-only (`exports.down = false`)

**Scale/Scope**:

- endpoints: `POST/PUT/GET /api/v1/agendamentos/**`
- UI: modais em `components/Agendamento/**`
- testes: `tests/integration/api/v1/agendamentos/**`

## Constitution Check

_GATE: Must pass before implementation. Re-check before final validation._

1. **Security and Session Integrity First**: PASS

- endpoints permanecem com autenticação/autorização em middleware
- cenários 401/403 cobertos conforme limite do modelo atual

2. **API and Model Boundary Discipline**: PASS

- persistência e regras no model; rota focada em orquestração/validação de entrada

3. **Test-First Delivery and Regression Safety**: PASS

- tarefas incluem testes por user story antes de implementação
- gate final exige `npm run test`

4. **Data Integrity and Migration Safety**: PASS

- sem alteração de schema planejada
- coerção e regras de transição de estado documentadas no data model

5. **Observability and Performance Accountability**: PASS

- estratégia de revalidação de cache explicitamente coberta

## Project Structure

### Documentation (this feature)

```text
specs/001-criacao-edicao-agendamentos/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── agendamentos-api.md
└── tasks.md
```

### Source Code (repository root)

```text
components/Agendamento/
hooks/
models/
pages/api/v1/agendamentos/
tests/integration/api/v1/agendamentos/
docs/
```

## Phase Plan (Aligned to tasks.md)

### Phase 1: Setup (T001-T004)

Objetivo:

- validar baseline de execução de testes, autenticação helper e cleanup determinístico.

Saída esperada:

- ambiente pronto para execução estável de integração.

### Phase 2: Foundational (T005-T009)

Objetivo:

- consolidar contrato, boundary API/model, autorização e estratégia de cache/revalidação.

Saída esperada:

- fundação técnica concluída para permitir implementação das histórias.

### Phase 3: US1 - Criar agendamento (T010-T016)

Objetivo:

- garantir criação com validação correta e persistência consistente.

Teste independente:

- `npx jest --runInBand --verbose tests/integration/api/v1/agendamentos/put.test.js` (cenários POST).

### Phase 4: US2 - Editar agendamento (T017-T024)

Objetivo:

- garantir edição com persistência de `sessaoRealizada`/`falta` e autorização correta.

Teste independente:

- `npx jest --runInBand --verbose tests/integration/api/v1/agendamentos/put.test.js` (cenários PUT).

### Phase 5: US3 - Integridade da API (T025-T030)

Objetivo:

- consolidar regressão de criação/edição/recorrência e compatibilidade de flags de atualização em massa.

Teste independente:

- `npm run test` com foco em `/api/v1/agendamentos/**`.

### Phase 6: US4 - GET padrão (T031-T036)

Objetivo:

- validar listagem padrão e cenários de autenticação.

Teste independente:

- `npx jest --runInBand --verbose tests/integration/api/v1/agendamentos/get.test.js`.

Observação:

- cenário 403 segue como decisão explícita de produto/modelo atual (task T034 + documentação).

### Phase 7: Polish (T037-T039)

Objetivo:

- fechamento de consistência entre artefatos e validação final da feature.

Gate final:

- execução obrigatória de `npm run test`.

## Dependencies & Execution Order

- Phase 1 precede Phase 2
- Phase 2 bloqueia início de todas as user stories
- US1 (P1) é o primeiro incremento MVP
- US2 depende da fundação e integra com resultados de US1
- US3 e US4 podem avançar em paralelo após Phase 2, respeitando dependências de teste
- Phase 7 só inicia após histórias prioritárias concluídas

## Complexity Tracking

Sem violações de constituição a justificar nesta iteração.
