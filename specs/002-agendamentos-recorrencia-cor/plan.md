# Implementation Plan: Agendamentos - recorrencia e cores de status

**Branch**: `[002-agendamentos-recorrencia-cor]` | **Date**: 2026-05-21 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-agendamentos-recorrencia-cor/spec.md`

**Note**: This plan follows `.specify/templates/plan-template.md` and the project constitution.

## Summary

Implementar dois ajustes no fluxo de agendamentos: sugerir e preservar automaticamente a data final da recorrencia em +3 meses, com atalho explicito no modal, e corrigir a renderizacao de cores/status na visao de agenda por periodo para manter consistencia visual com as demais visoes.

## Technical Context

**Language/Version**: TypeScript + JavaScript, Node.js 24.x, React 18, Next.js (pages router)

**Primary Dependencies**: next-connect, pg, swr, axios, react-hook-form, zod, redux-toolkit, radix-ui, sonner

**Storage**: PostgreSQL (Docker em desenvolvimento, conexao via `infra/database.js`)

**Testing**: Jest (`npm run test`, `npm run test:frontend`, `npm run test:single`)

**Target Platform**: Aplicacao web Next.js (desktop e mobile browsers)

**Project Type**: Web application full-stack (Next.js frontend + API routes)

**Performance Goals**: Preservar UX fluida no modal de agendamento e nas visoes de agenda sem renderizacao extra desnecessaria

**Constraints**: Manter middleware de auth/roles, convencoes de models/api routes e migrations forward-only; nao introduzir mudancas de API ou schema para uma correcao visual/UI

**Scale/Scope**: Sistema de gestao clinica (agendamentos, pacientes, terapeutas, sessoes e financeiro)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- Security and session integrity impact identified: nenhuma mudanca de auth, sessao ou permissao e esperada
- API/model boundary adherence documented: a correcao fica em componentes/frontend; endpoints e models existentes permanecem como contrato de regressao
- Test strategy includes fail-first coverage for all behavior and regression risks in scope: adicionar cobertura de UI/fluxo e manter os testes existentes de agendamentos verdes
- Data and migration impacts documented, including forward-only migration requirements: nao ha schema, migration ou dado persistido novo nesta entrega
- Observability/performance impact assessed for touched critical flows: impacto baixo, restrito a renderizacao do modal e de uma visao de agenda

## Project Structure

### Documentation (this feature)

```text
specs/002-agendamentos-recorrencia-cor/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
components/
├── Agendamento/
│   ├── AgendaPeriodoPersonalizado.tsx
│   └── NovoAgendamentoModal.tsx
hooks/
infra/
models/
pages/
public/
specs/
└── 002-agendamentos-recorrencia-cor/
  ├── plan.md
  ├── research.md
  ├── data-model.md
  ├── quickstart.md
  └── contracts/
store/
styles/
tests/
├── frontend/
│   └── agendamento/
├── helpers/
├── integration/
│   └── api/v1/
│       └── agendamentos/
├── infra/
├── mocks/
└── orchestrator.js
utils/
docs/
```

**Structure Decision**: Aplicacao web full-stack em um unico repositorio Next.js, com a correcao principal concentrada em `components/Agendamento/**` e cobertura de regressao em `tests/frontend/**` e `tests/integration/api/v1/agendamentos/**`.

## Complexity Tracking

Nenhuma violacao da constituicao exige justificativa adicional nesta entrega.
