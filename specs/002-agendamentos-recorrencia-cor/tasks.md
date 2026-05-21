# Tasks: Agendamentos - recorrencia e cores de status

**Input**: Design documents from `/specs/002-agendamentos-recorrencia-cor/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Testes sao obrigatorios para mudancas de comportamento nesta feature (frontend + regressao dos fluxos de agendamento).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Preparar estrutura de testes e baseline de trabalho para o feature.

- [x] T001 Confirmar baseline do escopo e arquivos-alvo em specs/002-agendamentos-recorrencia-cor/plan.md
- [x] T002 Criar estrutura de testes de agendamento em tests/frontend/agendamento/
- [x] T003 [P] Preparar utilitarios/factories de agendamento para testes de UI em tests/frontend/agendamento/agendamentoTestData.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Fundacoes necessarias para implementar US1 e US2 com consistencia.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Definir mapeamento visual padrao de status em components/Agendamento/agendamentoStatusAppearance.ts
- [x] T005 [P] Adicionar cobertura de comportamento base de status em tests/frontend/agendamento/agendamentoStatusAppearance.test.ts
- [x] T006 Garantir que `AgendaPeriodoPersonalizado` use o mapeamento compartilhado em components/Agendamento/AgendaPeriodoPersonalizado.tsx

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Facilitar agendamento recorrente (Priority: P1) 🎯 MVP

**Goal**: Sugerir data final de recorrencia com +3 meses, disponibilizar atalho e preservar alteracao manual.

**Independent Test**: Validar no modal que recorrencia ativa preenche data fim automaticamente, atalho reaplica +3 meses e valor manual nao e sobrescrito.

### Tests for User Story 1 (REQUIRED) ⚠️

- [x] T007 [P] [US1] Criar teste de sugestao automatica de data fim em tests/frontend/agendamento/NovoAgendamentoModal.recorrencia.test.tsx
- [x] T008 [P] [US1] Criar teste do atalho "Proximos 3 meses" em tests/frontend/agendamento/NovoAgendamentoModal.recorrencia.test.tsx
- [x] T009 [P] [US1] Criar teste de preservacao de valor manual da data fim em tests/frontend/agendamento/NovoAgendamentoModal.recorrencia.test.tsx

### Implementation for User Story 1

- [x] T010 [US1] Adicionar calculo com `addMonths` e importacoes necessarias em components/Agendamento/NovoAgendamentoModal.tsx
- [x] T011 [US1] Implementar preenchimento automatico condicional de `dataFimRecorrencia` em components/Agendamento/NovoAgendamentoModal.tsx
- [x] T012 [US1] Implementar acao de atalho para preencher +3 meses ao lado do DatePicker em components/Agendamento/NovoAgendamentoModal.tsx
- [x] T013 [US1] Garantir regra de nao sobrescrever valor manual ao reavaliar efeitos no formulario em components/Agendamento/NovoAgendamentoModal.tsx

**Checkpoint**: User Story 1 deve estar funcional e testavel de forma independente

---

## Phase 4: User Story 2 - Padronizar cores de status na agenda por periodo (Priority: P2)

**Goal**: Exibir status com semantica visual consistente (cancelado vermelho, concluido/falta verde, confirmado neutro).

**Independent Test**: Renderizar agendamentos com estados distintos e comparar a semantica visual entre Agenda Periodo Personalizado, Agenda Semanal, Agenda Mensal, Agenda por Terapeuta e Agenda sem Sala.

### Tests for User Story 2 (REQUIRED) ⚠️

- [x] T014 [P] [US2] Criar teste de status cancelado em vermelho na Agenda Periodo Personalizado com comparacao de semantica frente a Agenda Semanal, Agenda Mensal, Agenda por Terapeuta e Agenda sem Sala em tests/frontend/agendamento/AgendaPeriodoPersonalizado.status.test.tsx
- [x] T015 [P] [US2] Criar teste de sessao realizada/falta em verde na Agenda Periodo Personalizado com comparacao de semantica frente a Agenda Semanal, Agenda Mensal, Agenda por Terapeuta e Agenda sem Sala em tests/frontend/agendamento/AgendaPeriodoPersonalizado.status.test.tsx
- [x] T016 [P] [US2] Criar teste de confirmado com destaque neutro na Agenda Periodo Personalizado com comparacao de semantica frente a Agenda Semanal, Agenda Mensal, Agenda por Terapeuta e Agenda sem Sala em tests/frontend/agendamento/AgendaPeriodoPersonalizado.status.test.tsx

### Implementation for User Story 2

- [x] T017 [US2] Ajustar logica de classes da Agenda Periodo Personalizado para incluir sessao realizada/falta em components/Agendamento/AgendaPeriodoPersonalizado.tsx, consumindo o mapeamento compartilhado definido em T004 e mantendo semantica equivalente a Agenda Semanal, Agenda Mensal, Agenda por Terapeuta e Agenda sem Sala
- [x] T018 [US2] Ajustar logica de classes da Agenda Periodo Personalizado para confirmado neutro em components/Agendamento/AgendaPeriodoPersonalizado.tsx, consumindo o mapeamento compartilhado definido em T004 e alinhando ao padrao de Agenda Semanal, Agenda Mensal, Agenda por Terapeuta e Agenda sem Sala
- [x] T019 [US2] Validar consistencia visual entre Agenda Periodo Personalizado, Agenda Semanal, Agenda Mensal, Agenda por Terapeuta e Agenda sem Sala em tests/frontend/agendamento/AgendaStatusConsistency.views.test.tsx

**Checkpoint**: User Stories 1 e 2 funcionam de forma independente

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Consolidar validacao e documentacao da entrega.

- [x] T020 [P] Atualizar roteiro de validacao com 20 verificacoes visuais em specs/002-agendamentos-recorrencia-cor/quickstart.md
- [x] T021 Executar regressao focada de agendamentos com npm run test:single tests/integration/api/v1/agendamentos/get.test.js
- [x] T022 Executar regressao focada de agendamentos com npm run test:single tests/integration/api/v1/agendamentos/put.test.js
- [x] T023 Executar validacao completa com npm run test e registrar no fechamento o resultado do roteiro de 20 verificacoes em specs/002-agendamentos-recorrencia-cor/tasks.md
- [x] T024 Coletar e registrar evidencia objetiva de nao regressao de renderizacao/performance da agenda (tempo de render e responsividade visual) em specs/002-agendamentos-recorrencia-cor/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): No dependencies - can start immediately
- Foundational (Phase 2): Depends on Setup completion - blocks all user stories
- User Story 1 (Phase 3): Depends on Foundational completion
- User Story 2 (Phase 4): Depends on Foundational completion
- Polish (Phase 5): Depends on completion of US1 and US2

### User Story Dependencies

- US1 (P1): Can start after Phase 2 and is MVP by itself
- US2 (P2): Can start after Phase 2 and is independently testable

### Within Each User Story

- Tests must be written first and fail before implementation
- Implementacao deve respeitar componentes e contratos ja existentes
- Story so termina com testes da propria historia passando

### Parallel Opportunities

- T003 pode rodar em paralelo com T001/T002
- T005 pode rodar em paralelo com T004
- T007, T008 e T009 podem rodar em paralelo
- T014, T015 e T016 podem rodar em paralelo
- T020 pode rodar em paralelo com T021/T022
- T024 pode rodar em paralelo com T021/T022 apos implementacao de US2

---

## Parallel Example: User Story 1

```bash
# Testes da US1 em paralelo
T007 tests/frontend/agendamento/NovoAgendamentoModal.recorrencia.test.tsx
T008 tests/frontend/agendamento/NovoAgendamentoModal.recorrencia.test.tsx
T009 tests/frontend/agendamento/NovoAgendamentoModal.recorrencia.test.tsx
```

## Parallel Example: User Story 2

```bash
# Testes da US2 em paralelo
T014 tests/frontend/agendamento/AgendaPeriodoPersonalizado.status.test.tsx
T015 tests/frontend/agendamento/AgendaPeriodoPersonalizado.status.test.tsx
T016 tests/frontend/agendamento/AgendaPeriodoPersonalizado.status.test.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1 e Phase 2
2. Entregar US1 (Phase 3)
3. Validar comportamento de recorrencia de forma isolada
4. Liberar MVP

### Incremental Delivery

1. Setup + Foundational
2. US1 + validacao independente
3. US2 + validacao independente
4. Polish + regressao completa

### Parallel Team Strategy

1. Um dev prepara fundacao (T004-T006)
2. Um dev implementa US1 (T007-T013)
3. Outro dev implementa US2 (T014-T019)
4. Time consolida regressao e fechamento (T020-T024)

---

## Notes

- [P] tasks = arquivos diferentes sem dependencia direta
- [US1]/[US2] garantem rastreabilidade por historia
- Evitar mudancas de API/model/migration neste feature
- Executar `npm run test` antes de concluir

## Closing Validation Record

- Resultado roteiro visual de 20 verificacoes: 20/20 aprovadas (registrado em `specs/002-agendamentos-recorrencia-cor/quickstart.md`).
- Regressao focada:
  - `npm run test:single tests/integration/api/v1/agendamentos/get.test.js` passou.
  - `npm run test:single tests/integration/api/v1/agendamentos/put.test.js` passou.
- Validacao completa:
  - `npm run test` apresentou falha transiente de ambiente na primeira execucao.
  - `npm run test` passou na segunda execucao (33 suites passadas; 126 testes passados; 1 skipped).
