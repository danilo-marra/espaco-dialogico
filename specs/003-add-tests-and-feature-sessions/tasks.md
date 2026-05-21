# Tasks: Sessoes - status de pagamento e cobertura de integracao

**Input**: Design documents from `/specs/003-add-tests-and-feature-sessions/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/sessoes-status-individual.md, quickstart.md

**Tests**: Testes sao obrigatorios nesta feature (mudanca de comportamento + reforco de autorizacao + cobertura de regressao).

**Organization**: Tarefas agrupadas por user story para permitir implementacao e validacao independentes.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Preparar estrutura de arquivos e base de testes da feature.

- [x] T001 Criar estrutura de testes de Sessoes em tests/integration/api/v1/sessoes/put-status-success.test.js
- [x] T002 [P] Criar estrutura de testes de erro/autorizacao em tests/integration/api/v1/sessoes/put-status-errors.test.js
- [x] T003 [P] Criar estrutura de testes de consistencia final em tests/integration/api/v1/sessoes/put-status-consistency.test.js
- [x] T004 [P] Criar helper de fixtures para Sessoes em tests/integration/api/v1/sessoes/fixtures.js
- [x] T005 [P] Criar base de teste frontend para checkbox individual em tests/frontend/components/sessoes/SessoesTable.status-checkbox.test.tsx

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Ajustes obrigatorios de base antes das historias de usuario.

**⚠️ CRITICAL**: Nenhuma historia deve iniciar antes desta fase.

- [x] T006 Aplicar middleware de permissao por recurso em pages/api/v1/sessoes/[id]/index.js
- [x] T007 Definir matriz de respostas de erro do update de pagamentoRealizado (status HTTP, payload e mensagens) em pages/api/v1/sessoes/[id]/index.js
- [x] T008 Ajustar validacoes de update parcial no model em models/sessao.js
- [x] T009 [P] Criar thunk dedicado para status de pagamento (`pagamentoRealizado`) em store/sessoesSlice.ts
- [x] T010 [P] Ajustar tipagem de Sessao para fluxo de status de pagamento (`pagamentoRealizado`) em tipos.ts

**Checkpoint**: Fundacao pronta, historias podem iniciar.

---

## Phase 3: User Story 1 - Alterar status de pagamento da sessao (Priority: P1) 🎯 MVP

**Goal**: Permitir marcar/desmarcar pagamentoRealizado no item da lista de sessoes com persistencia imediata.

**Independent Test**: Alterar checkbox de uma sessao existente e confirmar persistencia apos recarregar.

### Tests for User Story 1 (REQUIRED)

- [x] T011 [US1] Implementar teste de integracao de sucesso em tests/integration/api/v1/sessoes/put-status-success.test.js
- [x] T012 [P] [US1] Implementar teste frontend de toggle com sucesso em tests/frontend/components/sessoes/SessoesTable.status-checkbox.test.tsx

### Implementation for User Story 1

- [x] T013 [US1] Adicionar checkbox individual de pagamentoRealizado por item de sessao em components/Sessoes/SessoesTable.tsx
- [x] T014 [US1] Implementar handler de toggle de pagamentoRealizado no dashboard em pages/dashboard/sessoes/index.tsx
- [x] T015 [US1] Integrar handler com thunk de pagamentoRealizado em pages/dashboard/sessoes/index.tsx
- [x] T016 [US1] Persistir pagamentoRealizado via store em store/sessoesSlice.ts
- [x] T017 [US1] Revalidar lista de sessoes apos sucesso em hooks/useFetchSessoes.ts

**Checkpoint**: US1 funcional e validavel isoladamente.

---

## Phase 4: User Story 2 - Tratar falha e permissao sem inconsistencia visual (Priority: P2)

**Goal**: Bloquear alteracoes sem permissao e manter UI consistente em falhas (incluindo `404` e `500`) sem retry automatico.

**Independent Test**: Simular permissao negada, sessao inexistente e erro interno, validando rollback visual, ausencia de retry automatico e mensagem adequada.

### Tests for User Story 2 (REQUIRED)

- [x] T018 [US2] Implementar teste de permissao negada (403) em tests/integration/api/v1/sessoes/put-status-errors.test.js
- [x] T019 [P] [US2] Implementar teste de falha interna (500) em tests/integration/api/v1/sessoes/put-status-errors.test.js
- [x] T020 [P] [US2] Implementar teste frontend de rollback visual e ausencia de retry automatico em tests/frontend/components/sessoes/SessoesTable.status-checkbox.test.tsx

### Implementation for User Story 2

- [x] T021 [US2] Implementar retorno de erro de autorizacao (403) no update de sessao conforme matriz definida em T007 em pages/api/v1/sessoes/[id]/index.js
- [x] T022 [US2] Implementar retornos de sessao inexistente (404) e erro interno de persistencia (500) no update de sessao conforme matriz definida em T007 em pages/api/v1/sessoes/[id]/index.js
- [x] T023 [US2] Implementar rollback do checkbox de pagamentoRealizado em falha no dashboard em pages/dashboard/sessoes/index.tsx
- [x] T024 [US2] Exibir feedback de erro ao usuario no fluxo de toggle em pages/dashboard/sessoes/index.tsx
- [x] T025 [US2] Desabilitar checkbox durante operacao pendente por item e impedir retry automatico no fluxo de toggle em components/Sessoes/SessoesTable.tsx

**Checkpoint**: US1 e US2 independentes, com resiliencia e autorizacao validadas.

---

## Phase 5: User Story 3 - Cobrir fluxos criticos de sessoes com testes de integracao (Priority: P3)

**Goal**: Garantir suite dedicada cobrindo sucesso, permissao, falha e consistencia final do dado.

**Independent Test**: Executar a suite dedicada de integracao de Sessoes em duas execucoes consecutivas e obter passagem estavel nos cenarios criticos.

### Tests for User Story 3 (REQUIRED)

- [x] T026 [US3] Implementar teste de consistencia do dado apos sucesso em tests/integration/api/v1/sessoes/put-status-consistency.test.js
- [x] T027 [P] [US3] Validar cenario de sessao inexistente com retorno 404 em tests/integration/api/v1/sessoes/put-status-errors.test.js
- [x] T028 [P] [US3] Garantir setup beforeAll padrao nos testes de Sessoes em tests/integration/api/v1/sessoes/fixtures.js
- [x] T029 [P] [US3] Implementar teste de nao regressao de escopo garantindo que toggle de pagamentoRealizado nao altera notaFiscal em tests/integration/api/v1/sessoes/put-status-consistency.test.js
- [x] T030 [US3] Implementar teste de concorrencia (duas atualizacoes quase simultaneas de pagamentoRealizado) validando regra last-write-wins em tests/integration/api/v1/sessoes/put-status-consistency.test.js

### Implementation for User Story 3

- [x] T031 [US3] Consolidar helpers de criacao de sessao/usuarios para a suite em tests/integration/api/v1/sessoes/fixtures.js
- [x] T032 [US3] Atualizar roteiro de execucao de testes da feature em specs/003-add-tests-and-feature-sessions/quickstart.md

**Checkpoint**: Cobertura critica de integracao de Sessoes pronta e estavel.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Fechamento da feature com validacao completa e higiene final.

- [x] T033 [P] Atualizar documentacao funcional da feature em docs/changelog-session-security.md (DoD: incluir resumo do toggle de pagamentoRealizado, cenarios de erro/autorizacao cobertos e referencia para specs/003-add-tests-and-feature-sessions/quickstart.md)
- [x] T034 Executar a suite dedicada de Sessoes em duas execucoes consecutivas e registrar evidencias em specs/003-add-tests-and-feature-sessions/quickstart.md
- [x] T035 [P] Revisar e ajustar mensagens de erro do dominio de sessoes em infra/errors.js (DoD: limitar ajustes aos erros usados no fluxo de update de sessao por pagamentoRealizado e registrar no quickstart as mensagens finais esperadas para 403, 404 e 500)
- [x] T036 Executar roteiro final de validacao manual em specs/003-add-tests-and-feature-sessions/quickstart.md
- [x] T037 [P] Executar checklist de escopo fora de Nota Fiscal e registrar evidencias em specs/003-add-tests-and-feature-sessions/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: inicia imediatamente.
- **Phase 2 (Foundational)**: depende da Phase 1 e bloqueia todas as user stories.
- **Phase 3 (US1)**: depende da Phase 2.
- **Phase 4 (US2)**: depende da Phase 2 e reaproveita fluxo de US1.
- **Phase 5 (US3)**: depende da Phase 2 e consolida cobertura final.
- **Phase 6 (Polish)**: depende das historias selecionadas concluidas.

### User Story Dependencies

- **US1 (P1)**: primeira entrega MVP.
- **US2 (P2)**: depende de US1 para validar rollback e mensagens sobre o fluxo de toggle ja implementado.
- **US3 (P3)**: depende de US1 e US2 para consolidar cobertura estavel dos contratos de sucesso/erro.

### Within Each User Story

- Escrever testes e confirmar falha inicial antes da implementacao.
- Implementar backend/frontend.
- Validar independencia da historia pelo criterio definido.

### Parallel Opportunities

- Setup: T002, T003, T004 e T005 em paralelo apos T001.
- Foundational: T009 e T010 em paralelo apos T006-T008.
- US1: T012 em paralelo com T011; T016 pode iniciar apos T009.
- US2: T019 e T020 em paralelo com T018; T022 garante alinhamento de contrato para 404/500.
- US3: T027, T028 e T029 em paralelo com T026; T030 depende desses resultados para validar concorrencia no mesmo fluxo.
- Polish: T035 e T037 em paralelo antes de T034/T036.

---

## Parallel Example: User Story 2

```bash
# Executar testes de erro em paralelo
Task: "T019 [US2] Implementar teste de falha interna (500) em tests/integration/api/v1/sessoes/put-status-errors.test.js"
Task: "T020 [P] [US2] Implementar teste frontend de rollback visual e ausencia de retry automatico em tests/frontend/components/sessoes/SessoesTable.status-checkbox.test.tsx"

# Depois implementar respostas de erro e rollback
Task: "T021 [US2] Implementar retorno de erro de autorizacao (403) no update de sessao conforme matriz definida em T007 em pages/api/v1/sessoes/[id]/index.js"
Task: "T023 [US2] Implementar rollback do checkbox em pages/dashboard/sessoes/index.tsx"
```

---

## Implementation Strategy

### MVP First (US1)

1. Concluir Setup + Foundational.
2. Entregar US1 completa (testes + implementacao).
3. Validar persistencia de pagamentoRealizado como incremento de valor principal.

### Incremental Delivery

1. Base pronta (Phase 1 + 2).
2. US1 (toggle com sucesso).
3. US2 (resiliencia/seguranca de UX em erro e permissao).
4. US3 (cobertura de integracao estabilizada).
5. Polish final com regressao completa.

### Parallel Team Strategy

1. Dev A: backend de autorizacao/erros + testes integracao.
2. Dev B: UI checkbox/rollback + testes frontend.
3. Dev C: fixtures, quickstart e consolidacao de cobertura.

---

## Notes

- Todas as tarefas seguem o formato checklist obrigatorio.
- Labels [US1]/[US2]/[US3] aparecem apenas nas fases de user stories.
- Tarefas [P] foram marcadas apenas quando viaveis sem conflito direto de dependencia.
- Validacao final obrigatoria: `npm run test`.
