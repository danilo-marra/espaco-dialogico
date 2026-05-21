# Feature Specification: Agendamentos - recorrencia e cores de status

**Feature Branch**: `[002-agendamentos-recorrencia-cor]`

**Created**: 2026-05-21

**Status**: Draft

**Input**: User description: "crie uma nova feature e fix de acordo com o que esta na issue 147"

**Project Context Defaults**:

- Produto web de gestao clinica (pacientes, terapeutas, agendamentos, sessoes, financeiro)
- Perfis padrao: `admin`, `secretaria`, `terapeuta`
- Endpoints esperados em `pages/api/v1/**` com regras de negocio em `models/**`
- Testes esperados em `tests/integration/**` e/ou `tests/frontend/**`

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Facilitar agendamento recorrente (Priority: P1)

Usuario que cria ou edita um agendamento recorrente recebe uma data final sugerida automaticamente e pode ajusta-la com um atalho simples.

**Why this priority**: Reduz friccao no fluxo principal de criacao e edicao de agendamentos recorrentes, que e um caso de uso frequente e sensivel a erro manual.

**Independent Test**: Pode ser testado abrindo o fluxo de agendamento recorrente, verificando a sugestao inicial da data final e confirmando que o atalho aplica a mesma regra de tres meses.

**Acceptance Scenarios**:

1. **Given** um agendamento recorrente com data de inicio definida e sem data final escolhida, **When** a recorrencia e ativada, **Then** o sistema sugere uma data final exatamente tres meses depois da data de inicio.
2. **Given** um formulario de agendamento recorrente, **When** o usuario usa o atalho para preencher a data final, **Then** a data sugerida passa a refletir tres meses apos a data de inicio.
3. **Given** o usuario altera manualmente a data final sugerida, **When** o formulario e salvo e reaberto, **Then** o valor escolhido manualmente continua preservado.

---

### User Story 2 - Padronizar cores de status na agenda por periodo (Priority: P2)

Usuario que consulta a agenda em um periodo personalizado consegue distinguir cancelados, concluidos/ausentes e confirmados por cores consistentes com as visoes Agenda Semanal, Agenda Mensal, Agenda por Terapeuta e Agenda sem Sala.

**Why this priority**: A consistencia visual evita interpretacoes erradas da agenda, reduz confusao operativa e facilita leitura rapida do status dos compromissos.

**Independent Test**: Pode ser testado comparando o mesmo agendamento entre Agenda Periodo Personalizado, Agenda Semanal, Agenda Mensal, Agenda por Terapeuta e Agenda sem Sala, verificando se o significado das cores permanece consistente.

**Acceptance Scenarios**:

1. **Given** um agendamento cancelado, **When** ele aparece na agenda por periodo, **Then** ele e exibido em vermelho.
2. **Given** um agendamento concluido ou marcado como ausente, **When** ele aparece na agenda por periodo, **Then** ele e exibido em verde.
3. **Given** um agendamento confirmado, mas ainda nao concluido, **When** ele aparece na agenda por periodo, **Then** ele usa a mesma convencao de destaque neutro observada em Agenda Semanal, Agenda Mensal, Agenda por Terapeuta e Agenda sem Sala.

## Edge Cases

- O sistema nao deve sugerir data final quando a recorrencia nao estiver ativa.
- Se a data de inicio mudar depois da sugestao inicial, o valor manual escolhido pelo usuario deve continuar sendo respeitado.
- Se um agendamento tiver estados visuais concorrentes, o estado de cancelamento deve continuar sendo o mais evidente para o usuario.
- A mesma regra visual deve permanecer compreensivel quando o usuario compara Agenda Periodo Personalizado, Agenda Semanal, Agenda Mensal, Agenda por Terapeuta e Agenda sem Sala para o mesmo compromisso.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: O sistema DEVE sugerir automaticamente uma data final exatamente tres meses apos a data de inicio quando a recorrencia estiver ativa e nenhuma data final tiver sido definida.
- **FR-002**: O sistema DEVE oferecer um atalho para preencher a data final com tres meses de antecedencia em relacao a data de inicio.
- **FR-003**: O sistema DEVE preservar a data final escolhida manualmente pelo usuario sem sobrescreve-la em interacoes posteriores do formulario.
- **FR-004**: O sistema DEVE exibir agendamentos cancelados em vermelho na agenda por periodo.
- **FR-005**: O sistema DEVE exibir agendamentos concluidos ou ausentes em verde na agenda por periodo.
- **FR-006**: O sistema DEVE manter a mesma convencao de destaque neutro para agendamentos confirmados, mas ainda nao concluidos, em Agenda Periodo Personalizado, Agenda Semanal, Agenda Mensal, Agenda por Terapeuta e Agenda sem Sala.

### Key Entities _(include if feature involves data)_

- **Configuracao de recorrencia**: representa a escolha de repetir um agendamento, incluindo data de inicio, data final e a sugestao automatica de termino.
- **Status visual da agenda**: representa a forma como o usuario identifica cancelamento, conclusao/ausencia e confirmacao em cada visao da agenda.
- **Agendamento**: representa o compromisso exibido ao usuario e o objeto principal afetado por recorrencia e cores de status.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Em 100% dos casos validos de agendamento recorrente, a data final sugerida aparece preenchida com tres meses de antecedencia em relacao a data de inicio.
- **SC-002**: Em 100% dos casos em que o usuario altera manualmente a data final, o valor salvo continua sendo o escolhido pelo usuario ao reabrir o formulario.
- **SC-003**: Em 100% dos compromissos exibidos na Agenda Periodo Personalizado, Agenda Semanal, Agenda Mensal, Agenda por Terapeuta e Agenda sem Sala, as cores de cancelado, concluido/ausente e confirmado transmitem o mesmo significado visual.
- **SC-004**: Em um roteiro de validacao com 20 verificacoes visuais (4 por visao em 5 visoes), pelo menos 19 verificacoes DEVEM classificar corretamente cancelado, concluido/ausente e confirmado neutro sem orientacao adicional.

## Assumptions

- O fluxo de criacao e edicao de agendamentos recorrentes ja existe e continua sendo o ponto de entrada para esta melhoria.
- As regras de permissao existentes para agendamentos nao serao alteradas por esta entrega.
- Esta feature nao altera notificacoes, cobrancas ou regras de disponibilidade de horario.
- A convencao de cores atual da agenda continua sendo a referencia visual; esta entrega apenas corrige a consistencia entre visoes.
