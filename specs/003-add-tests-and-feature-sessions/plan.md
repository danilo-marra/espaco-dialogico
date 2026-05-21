# Implementation Plan: Sessoes - status de pagamento e cobertura de integracao

**Branch**: `[003-add-tests-and-feature-sessions]` | **Date**: 2026-05-21 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/003-add-tests-and-feature-sessions/spec.md`

## Summary

Adicionar alteracao de status de pagamento da sessao (`pagamentoRealizado`) via checkbox no item da lista de Sessoes, com persistencia imediata, tratamento robusto de erro/permissao e cobertura de integracao para os cenarios criticos (sucesso, autorizacao negada, falha de persistencia, sessao inexistente com 404 e consistencia final), mantendo concorrencia como edge case tratado pelo backend/UI. O fluxo deve bloquear cliques repetidos por item durante requisicao pendente e nao executar retry automatico.

## Technical Context

**Language/Version**: TypeScript + JavaScript, Node.js 22.x, React 18, Next.js (pages router)

**Primary Dependencies**: next-connect, pg, swr, axios, react-hook-form, zod, redux-toolkit, radix-ui, sonner

**Storage**: PostgreSQL (Docker em desenvolvimento, conexao via `infra/database.js`)

**Testing**: Jest (`npm run test`, `npm run test:frontend`, `npm run test:single`)

**Target Platform**: Aplicacao web Next.js (desktop e mobile browsers)

**Project Type**: Web application full-stack (Next.js frontend + API routes)

**Performance Goals**: Preservar atualizacao rapida da listagem de Sessoes apos toggle por item, sem regressao perceptivel de renderizacao/revalidacao.

**Constraints**: Manter stack de auth/permissoes (`authMiddleware` + `requirePermission`), preservar padrao de rotas com `controller.errorHandlers`, manter regras de negocio em `models/**`, evitar mudancas fora do dominio de Sessoes e nao introduzir retry automatico no toggle.

**Scale/Scope**: Sistema de gestao clinica (agendamentos, pacientes, terapeutas, sessoes e financeiro)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- Security and session integrity impact identified (auth, session versioning, role boundaries)
- API/model boundary adherence documented (`pages/api/v1/**` + `models/**` responsibilities)
- Test strategy includes fail-first coverage for all behavior and regression risks in scope
- Data and migration impacts documented, including forward-only migration requirements
- Observability/performance impact assessed for touched critical flows

Resultado pre-Phase 0: PASS. A entrega altera fluxo autenticado de update de Sessao e inclui reforco explicito de autorizacao por recurso com regras de resposta para 403/404/500.

## Project Structure

### Documentation (this feature)

```text
specs/003-add-tests-and-feature-sessions/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md
```

### Source Code (repository root)

```text
components/
├── Sessoes/
│   ├── SessoesTable.tsx
│   └── EditarSessaoModal.tsx
hooks/
├── useFetchSessoes.ts
infra/
├── controller.js
├── database.js
├── errors.js
models/
├── sessao.js
pages/
├── api/v1/sessoes/
│   ├── index.js
│   └── [id]/index.js
└── dashboard/sessoes/index.tsx
store/
├── sessoesSlice.ts
tests/
├── frontend/
│   └── components/sessoes/
└── integration/
    └── api/v1/sessoes/
docs/
```

**Structure Decision**: Aplicacao web full-stack em um unico repositorio Next.js. A mutacao de pagamento por item permanece no fluxo de Sessoes (UI + API existente), a persistencia continua no `models/sessao.js`, e a confiabilidade e validada por testes de integracao dedicados em `tests/integration/api/v1/sessoes/**`.

## Phase 0: Research Output

`research.md` consolida decisoes para: update por ID com payload parcial de `pagamentoRealizado`, autorizacao explicita por recurso, perfis autorizados (`admin`, `secretaria`), semantica de concorrencia (last-write-wins + revalidacao), sessao inexistente com `404 Not Found`, e politica sem retry automatico.

## Phase 1: Design and Contracts Output

- `data-model.md` define as entidades logicas da feature (Sessao, StatusPagamentoSessao, ResultadoAtualizacaoSessao, ContextoPermissaoSessao), incluindo estados de loading/erro sem retry automatico.
- `contracts/sessoes-status-individual.md` define contrato funcional de UI + API para alteracao de status de pagamento, com respostas 401/403/404/500 e rollback visual.
- `quickstart.md` define roteiro de validacao manual e automatizada com cenarios de permissao, sessao inexistente, falha de persistencia e tentativa manual apos erro.

## Constitution Check (Post-Design)

- Security and session integrity: PASS. Contrato explicita controles de autenticacao/autorizacao e limita alteracao a `admin`/`secretaria`.
- API/model boundary discipline: PASS. Rota por ID permanece fina com middleware de permissao e persistencia no model.
- Test-first and regression safety: PASS. Suite dedicada cobre sucesso, permissao negada, falha de persistencia, not found, consistencia e concorrencia.
- Data integrity and migration safety: PASS. Sem mudanca de schema ou migration para esta entrega.
- Observability and performance accountability: PASS. Fluxo inclui feedback por item, rollback e revalidacao para consistencia final.

## Complexity Tracking

Nenhuma violacao da constituicao exige justificativa adicional nesta entrega.
