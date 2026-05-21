# Feature Specification: Sessoes - status de pagamento e cobertura de integracao

**Feature Branch**: `[003-add-tests-and-feature-sessions]`

**Created**: 2026-05-21

**Status**: Draft

**Input**: User description: "Issue #151 - evoluir Sessoes para alteracao de status de pagamento (`pagamentoRealizado`) via checkbox e criar testes de integracao dos fluxos criticos"

**Project Context Defaults**:

- Produto web de gestao clinica (pacientes, terapeutas, agendamentos, sessoes, financeiro)
- Perfis padrao: admin, secretaria, terapeuta
- Endpoints esperados em pages/api/v1/** com regras de negocio em models/**
- Testes esperados em tests/integration/** e/ou tests/frontend/**

## Clarifications

### Session 2026-05-21

- Q: Quais perfis podem alterar `pagamentoRealizado` em Sessoes? -> A: Apenas `admin` e `secretaria`; `terapeuta` nao pode.
- Q: Como tratar cliques repetidos no mesmo checkbox durante requisicao pendente? -> A: Ignorar novos cliques enquanto o item estiver em processamento (checkbox desabilitado).
- Q: Qual status HTTP usar quando a sessao nao existir no momento do toggle? -> A: `404 Not Found`.
- Q: Qual estrategia de retry usar em falha temporaria no toggle? -> A: Sem retry automatico; nova tentativa manual pelo usuario.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Alterar status de pagamento da sessao (Priority: P1)

Usuario com permissao de gestao de sessoes altera o status de pagamento (`pagamentoRealizado`) de uma sessao especifica por meio de um checkbox no item individual, sem precisar editar outros campos.

**Why this priority**: Este e o valor principal da feature e reduz tempo operacional no fluxo diario de acompanhamento.

**Independent Test**: Pode ser validado alterando o checkbox de uma sessao existente e confirmando que o novo estado permanece apos recarregar a tela.

**Acceptance Scenarios**:

1. **Given** usuario autenticado com permissao para atualizar sessoes e sessao existente, **When** marca ou desmarca o checkbox de status de pagamento, **Then** o novo valor de `pagamentoRealizado` e salvo e exibido imediatamente no item.
2. **Given** alteracao de `pagamentoRealizado` concluida, **When** usuario atualiza a pagina ou retorna para a listagem, **Then** o estado exibido continua igual ao ultimo valor salvo.

---

### User Story 2 - Tratar falha e permissao sem inconsistencia visual (Priority: P2)

Usuario recebe retorno claro quando nao pode alterar o status de pagamento (`pagamentoRealizado`) ou quando ocorre falha de persistencia, sem deixar a interface em estado divergente do dado real.

**Why this priority**: Evita erros operacionais e garante confianca no dado de sessoes.

**Independent Test**: Pode ser validado simulando tentativa sem permissao, sessao inexistente (`404`) e erro interno, confirmando mensagem de erro, reversao visual do checkbox para o ultimo estado valido e ausencia de retry automatico.

**Acceptance Scenarios**:

1. **Given** usuario autenticado sem permissao para alterar sessoes (incluindo perfil `terapeuta`), **When** tenta alterar o checkbox, **Then** a operacao e negada, o estado visual volta ao valor anterior e o usuario recebe erro de autorizacao.
2. **Given** usuario com permissao e falha de persistencia no momento da alteracao, **When** altera o checkbox, **Then** o sistema informa erro padronizado e mantem consistencia entre UI e dado persistido.

---

### User Story 3 - Cobrir fluxos criticos de sessoes com testes de integracao (Priority: P3)

Time executa a suite de integracao de Sessoes e confirma cobertura estavel para sucesso, permissao negada, sessao inexistente (`404`), falha de persistencia e consistencia final do dado.

**Why this priority**: Reduz regressao em um fluxo sensivel e aumenta previsibilidade de deploy.

**Independent Test**: Pode ser validado executando os testes de integracao de Sessoes e verificando que os cenarios criticos passam de forma repetivel.

**Acceptance Scenarios**:

1. **Given** suite de integracao de Sessoes com cenarios criticos definidos, **When** os testes sao executados em ambiente padrao do projeto, **Then** os cenarios de sucesso, permissao negada e falha de persistencia sao exercitados.
2. **Given** alteracao de status de pagamento com sucesso no teste de integracao, **When** o caso consulta o registro apos a operacao, **Then** o valor salvo de `pagamentoRealizado` corresponde exatamente ao esperado.

### Edge Cases

- Alteracoes concorrentes no mesmo registro devem seguir a regra last-write-wins confirmada pelo backend, com revalidacao da lista para refletir o ultimo valor persistido de `pagamentoRealizado`.
- Repeticao rapida de clique no checkbox nao deve gerar estado visual incoerente com o ultimo retorno valido da operacao; durante requisicao pendente do item, novos cliques devem ser ignorados com checkbox desabilitado.
- Se a sessao alvo nao existir mais no momento da alteracao, o sistema deve retornar `404 Not Found`, mensagem compreensivel e manter a UI consistente.
- Se houver indisponibilidade temporaria no servico, o usuario deve receber erro e conseguir tentar novamente sem recarregar toda a pagina, sem retry automatico.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: O sistema DEVE permitir que usuario autorizado (`admin` ou `secretaria`) altere o status de pagamento da sessao (`pagamentoRealizado`) por meio de checkbox no item da sessao.
- **FR-002**: O sistema DEVE persistir a alteracao de `pagamentoRealizado` e refletir o novo valor na interface apos confirmacao da operacao.
- **FR-003**: O sistema DEVE impedir alteracao de status de pagamento (`pagamentoRealizado`) por usuarios sem permissao (incluindo `terapeuta`) e informar erro de autorizacao de forma clara.
- **FR-004**: O sistema DEVE tratar falhas de persistencia com erro padronizado e manter consistencia entre estado visual e dado persistido, desabilitando o checkbox do item durante requisicao pendente para evitar concorrencia de cliques locais.
- **FR-007**: O sistema DEVE retornar `404 Not Found` quando a sessao alvo da alteracao de `pagamentoRealizado` nao existir no momento da operacao, mantendo rollback visual e feedback claro ao usuario.
- **FR-008**: O sistema NAO DEVE executar retry automatico em falhas temporarias do toggle de `pagamentoRealizado`; o retry deve ocorrer somente por nova acao explicita do usuario.
- **FR-005**: O sistema DEVE disponibilizar cobertura de testes de integracao para os cenarios criticos de alteracao de `pagamentoRealizado` em Sessoes: sucesso, permissao negada, sessao inexistente (`404`), falha de persistencia e verificacao de consistencia final.
- **FR-006**: O sistema DEVE manter o escopo da entrega restrito ao dominio de Sessoes, sem incluir fluxos de Nota Fiscal.

### Key Entities _(include if feature involves data)_

- **Sessao**: representa um atendimento com identificador unico, relacao com paciente e terapeuta, e status de pagamento (`pagamentoRealizado`) alteravel no fluxo da feature.
- **Status de Pagamento da Sessao**: representa o estado booleano `pagamentoRealizado` controlado no item individual da interface e refletido no dado persistido.
- **Permissao de Usuario**: representa a autorizacao para alterar status de sessao conforme perfil e regras de acesso vigentes no produto, limitada a `admin` e `secretaria` nesta feature.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Em ambiente de validacao funcional, 100% das alteracoes de `pagamentoRealizado` realizadas por usuarios autorizados devem permanecer persistidas apos recarregamento da tela.
- **SC-002**: Em validacao de autorizacao, 100% das tentativas de alteracao feitas por usuarios sem permissao devem ser bloqueadas e apresentar retorno de erro ao usuario.
- **SC-003**: Em validacao de resiliencia, 100% dos cenarios simulados de falha de persistencia devem manter consistencia visual com o ultimo estado valido do dado.
- **SC-004**: A suite de integracao de Sessoes deve incluir os cinco cenarios criticos definidos e executar sem falhas em pelo menos duas execucoes consecutivas no ambiente padrao de testes do projeto.

## Assumptions

- O fluxo atual de listagem e interacao de itens de Sessoes ja existe e sera a base da evolucao.
- As regras de autenticacao e permissao ja adotadas no sistema permanecem inalteradas nesta entrega.
- O status de pagamento da Sessao (`pagamentoRealizado`) ja possui representacao de dominio suficiente para permitir validacao de consistencia apos alteracao.
- Esta feature nao contempla refatoracoes amplas fora do modulo de Sessoes nem mudancas em Nota Fiscal.
