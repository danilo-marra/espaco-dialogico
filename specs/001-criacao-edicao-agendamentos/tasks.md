---
description: "Task list for feature: Criação e edição de agendamentos"
---

# Tasks: Criação e edição de agendamentos

**Input**: Design documents from `/specs/001-criacao-edicao-agendamentos/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/agendamentos-api.md, quickstart.md

**Tests**: Testes são obrigatórios para mudanças de comportamento nesta feature.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: alinhar baseline de execução e escopo técnico compartilhado

- [x] T001 Validar comandos e gate de testes em package.json e specs/001-criacao-edicao-agendamentos/quickstart.md
- [x] T002 [P] Confirmar baseline de autenticação de testes em tests/helpers/auth.js
- [x] T003 [P] Confirmar baseline de servidor de testes em tests/helpers/serverManager.js
- [x] T004 [P] Validar precondições de banco e cleanup em tests/orchestrator.js

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: pré-requisitos técnicos obrigatórios antes das user stories

**CRITICAL**: Nenhuma user story começa antes desta fase.

- [x] T005 [P] Alinhar contrato objetivo dos endpoints em specs/001-criacao-edicao-agendamentos/contracts/agendamentos-api.md
- [x] T006 [P] Garantir fronteira API/model em pages/api/v1/agendamentos/index.js e models/agendamento.js
- [x] T007 [P] Garantir regras de autorização nas rotas em pages/api/v1/agendamentos/[id]/index.js e pages/api/v1/agendamentos/recurrences/[id]/index.js
- [x] T008 [P] Garantir estratégia de revalidação de agenda em hooks/useFetchAgendamentos.ts e pages/dashboard/agenda/index.tsx
- [x] T009 Documentar decisão de compatibilidade de recorrência em specs/001-criacao-edicao-agendamentos/research.md

**Checkpoint**: fundação pronta, user stories podem iniciar.

---

## Phase 3: User Story 1 - Criar novo agendamento (Priority: P1) 🎯 MVP

**Goal**: permitir criação de agendamento com validação e persistência consistentes

**Independent Test**: executar `npx jest --runInBand --verbose tests/integration/api/v1/agendamentos/put.test.js` cobrindo POST sucesso/erro

### Tests for User Story 1 (write first)

- [x] T010 [P] [US1] Criar teste de sucesso do POST em tests/integration/api/v1/agendamentos/put.test.js
- [x] T011 [P] [US1] Criar teste de validação 400/422 do POST em tests/integration/api/v1/agendamentos/put.test.js
- [x] T012 [P] [US1] Criar teste de autenticação 401 do POST em tests/integration/api/v1/agendamentos/put.test.js

### Implementation for User Story 1

- [x] T013 [US1] Ajustar persistência de campos obrigatórios e booleans no create em models/agendamento.js
- [x] T014 [US1] Ajustar tratamento de criação e sessão associada no endpoint POST em pages/api/v1/agendamentos/index.js
- [x] T015 [US1] Ajustar envio de payload de criação no modal em components/Agendamento/NovoAgendamentoModal.tsx
- [x] T016 [US1] Validar feedback de erro/sucesso de criação no fluxo da agenda em pages/dashboard/agenda/index.tsx

**Checkpoint**: US1 funcional e testável isoladamente.

---

## Phase 4: User Story 2 - Editar agendamento existente (Priority: P2)

**Goal**: permitir edição segura de agendamento, incluindo flags de sessão/falta

**Independent Test**: executar `npx jest --runInBand --verbose tests/integration/api/v1/agendamentos/put.test.js` cobrindo PUT simples e autorização

### Tests for User Story 2 (write first)

- [x] T017 [P] [US2] Criar teste de sucesso do PUT simples em tests/integration/api/v1/agendamentos/put.test.js
- [x] T018 [P] [US2] Criar teste de persistência de `sessaoRealizada` e `falta` no PUT em tests/integration/api/v1/agendamentos/put.test.js
- [x] T019 [P] [US2] Criar teste de autorização 403 no PUT em tests/integration/api/v1/agendamentos/put.test.js
- [x] T020 [P] [US2] Criar teste de validação 422 (`localAgendamento` inválido) no PUT em tests/integration/api/v1/agendamentos/put.test.js

### Implementation for User Story 2

- [x] T021 [US2] Ajustar coerção e update de booleans no model de edição em models/agendamento.js
- [x] T022 [US2] Ajustar regras de sessão/falta no endpoint PUT por id em pages/api/v1/agendamentos/[id]/index.js
- [x] T023 [US2] Ajustar inicialização/envio dos checkboxes no modal de edição em components/Agendamento/EditarAgendamentoModal.tsx
- [x] T024 [US2] Ajustar sincronização de cache após edição em hooks/useFetchAgendamentos.ts

**Checkpoint**: US2 funcional e testável isoladamente.

---

## Phase 5: User Story 3 - Testes de integridade da API /agendamentos (Priority: P3)

**Goal**: consolidar regressão dos fluxos de criação/edição/recorrência

**Independent Test**: executar `npm run test` com foco em ausência de regressão em `/api/v1/agendamentos/**`

### Tests for User Story 3 (write first)

- [x] T025 [P] [US3] Expandir cenário de recorrência (POST/PUT) em tests/integration/api/v1/agendamentos/put.test.js
- [x] T026 [P] [US3] Criar teste para compatibilidade `updateAllRecurrences`/`updateAllRecorrences` em tests/integration/api/v1/agendamentos/put.test.js

### Implementation for User Story 3

- [x] T027 [US3] Ajustar contrato de atualização em massa de recorrência em pages/api/v1/agendamentos/recurrences/[id]/index.js
- [x] T028 [US3] Ajustar consistência de criação/remoção de sessão em recorrência em pages/api/v1/agendamentos/recurrences/[id]/index.js
- [x] T029 [US3] Atualizar guia de validação executável em specs/001-criacao-edicao-agendamentos/quickstart.md
- [x] T030 [US3] Executar regressão completa via script em package.json

**Checkpoint**: US3 validada com regressão completa.

---

## Phase 6: User Story 4 - Consultar agendamentos em cenário padrão (Priority: P3)

**Goal**: validar GET padrão com contrato estável e cenários de autenticação

**Independent Test**: executar `npx jest --runInBand --verbose tests/integration/api/v1/agendamentos/get.test.js`

### Tests for User Story 4 (write first)

- [x] T031 [P] [US4] Criar teste de sucesso 200 com estrutura mínima no GET em tests/integration/api/v1/agendamentos/get.test.js
- [x] T032 [P] [US4] Criar teste de 401 no GET sem autenticação em tests/integration/api/v1/agendamentos/get.test.js
- [x] T033 [P] [US4] Criar teste de 401 para token inválido no GET em tests/integration/api/v1/agendamentos/get.test.js
- [x] T034 [P] [US4] Tratar cenário 403 no GET com decisão explícita em tests/integration/api/v1/agendamentos/get.test.js

### Implementation for User Story 4

- [x] T035 [US4] Garantir proteção de listagem e contrato de resposta no endpoint GET em pages/api/v1/agendamentos/index.js
- [x] T036 [US4] Atualizar documentação da limitação conhecida do 403 em docs/validacao-get-agendamentos.md

**Checkpoint**: US4 validada de forma independente (com limitação 403 formalizada quando aplicável).

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: fechamento transversal de qualidade e documentação

- [x] T037 [P] Revisar consistência entre spec/plan/tasks em specs/001-criacao-edicao-agendamentos/spec.md e specs/001-criacao-edicao-agendamentos/plan.md
- [x] T038 [P] Atualizar notas técnicas de implementação em docs/validacao-get-agendamentos.md
- [x] T039 Rodar validação final da feature com `npm run test` definido em package.json

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 → pode iniciar imediatamente
- Phase 2 → depende da Phase 1 e bloqueia user stories
- Phase 3, 4, 5, 6 → dependem da conclusão da Phase 2
- Phase 7 → depende das user stories concluídas

### User Story Dependencies

- US1 (P1) é o MVP
- US2 (P2) depende da base de US1 + fundação
- US3 (P3) depende de US1/US2 para regressão de integridade
- US4 (P3) pode rodar em paralelo com US3 após Phase 2

### Within Each User Story

- Escrever testes e observar falha antes da implementação
- Ajustar model/regra de negócio antes de rota e UI
- Validar story isoladamente antes de avançar

---

## Parallel Opportunities

- Phase 1: T002, T003, T004
- Phase 2: T005, T006, T007, T008
- US1: T010, T011, T012
- US2: T017, T018, T019, T020
- US3: T025, T026
- US4: T031, T032, T033, T034
- Phase 7: T037, T038

---

## Parallel Example: User Story 2

```bash
# Testes em paralelo (US2)
T017 tests/integration/api/v1/agendamentos/put.test.js
T018 tests/integration/api/v1/agendamentos/put.test.js
T019 tests/integration/api/v1/agendamentos/put.test.js
T020 tests/integration/api/v1/agendamentos/put.test.js

# Implementação em paralelo (US2)
T021 models/agendamento.js
T023 components/Agendamento/EditarAgendamentoModal.tsx
T024 hooks/useFetchAgendamentos.ts
```

---

## Implementation Strategy

### MVP First (US1)

1. Concluir Phase 1
2. Concluir Phase 2
3. Concluir Phase 3 (US1)
4. Validar US1 isoladamente

### Incremental Delivery

1. Entregar US1 (MVP)
2. Entregar US2 (edição e persistência robusta)
3. Entregar US3 (integridade/regressão)
4. Entregar US4 (GET padrão + documentação da limitação 403)
5. Fechamento em Phase 7

### Validation Gate

- Gate de qualidade final obrigatório: `npm run test`
- Se US4 mantiver limitação 403 por regra de produto, registrar no teste e na documentação técnica
