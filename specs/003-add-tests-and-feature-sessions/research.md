# Research: Sessoes - status de pagamento e cobertura de integracao

## Decision 1: Reutilizar endpoint de update por ID para alteracao de status de pagamento

- Decision: usar `PUT /api/v1/sessoes/[id]` para atualizar apenas o campo de status de pagamento (`pagamentoRealizado`) por payload parcial.
- Rationale: o endpoint e o model de update ja existem e suportam atualizacao parcial, reduzindo risco e evitando proliferacao de rotas.
- Alternatives considered: criar endpoint dedicado (`PATCH /sessoes/[id]/status`) ou nova rota bulk para item unico. Rejeitado por aumentar superficie de manutencao sem ganho funcional para a issue.

## Decision 2: Tornar autorizacao por recurso explicita na rota por ID

- Decision: garantir `requirePermission("sessoes")` tambem nas operacoes de `GET/PUT/DELETE` em `pages/api/v1/sessoes/[id]/index.js`.
- Rationale: o contrato da issue exige cenario de permissao negada e consistencia com o padrao do projeto (`authMiddleware` + `requirePermission(...)`), com alteracao permitida apenas para `admin` e `secretaria`.
- Alternatives considered: depender apenas de autenticacao em `authMiddleware`. Rejeitado porque nao cobre bloqueio por recurso e enfraquece governanca de acesso.

## Decision 3: Adicionar checkbox individual de pagamento no item da sessao com atualizacao otimista segura

- Decision: inserir checkbox individual no item renderizado em `components/Sessoes/SessoesTable.tsx`, disparando mutacao por item e aplicando rollback visual em caso de erro.
- Rationale: atende objetivo funcional da issue sem obrigar abertura de modal de edicao para uma alteracao simples e frequente.
- Alternatives considered: manter alteracao apenas no modal de edicao (`EditarSessaoModal`). Rejeitado por nao cumprir requisito de alteracao individual via checkbox no item.

## Decision 4: Cobertura de integracao dedicada para Sessoes em pasta propria

- Decision: criar testes em `tests/integration/api/v1/sessoes/` cobrindo sucesso, permissao negada, falha interna de persistencia e verificacao de consistencia do dado apos sucesso.
- Rationale: atualmente nao ha suite dedicada de integracao para esse recurso; os cenarios aparecem apenas de forma indireta em outras suites.
- Alternatives considered: cobrir apenas com frontend tests. Rejeitado porque os criterios de aceite exigem robustez da API e persistencia.

## Decision 5: Sem mudancas de schema/migrations nesta feature

- Decision: nao criar migrations nem alterar estrutura de tabela para a entrega da issue 151.
- Rationale: a capacidade necessaria ja existe no dominio de Sessao; a entrega e de comportamento, permissao e cobertura.
- Alternatives considered: adicionar campos novos de status. Rejeitado por escopo e por nao haver necessidade funcional comprovada.

## Decision 6: Formalizar semantica de concorrencia como last-write-wins com revalidacao

- Decision: quando ocorrerem duas atualizacoes quase simultaneas de `pagamentoRealizado` para a mesma sessao, considerar valido o ultimo valor persistido no backend e revalidar a lista para refletir esse estado.
- Rationale: evita estado divergente em UI sob concorrencia e torna o comportamento observavel/testavel de ponta a ponta.
- Alternatives considered: lock otimista com versao na API ou bloqueio hard de interacao ate confirmacao global. Rejeitado por aumentar escopo da issue sem necessidade funcional imediata.

## Decision 7: Sessao inexistente retorna 404 no update de pagamento

- Decision: quando `PUT /api/v1/sessoes/[id]` receber um `id` inexistente para alteracao de `pagamentoRealizado`, retornar `404 Not Found` com mensagem compreensivel.
- Rationale: separa claramente ausencia de recurso de falha interna, melhora rastreabilidade e previsibilidade de testes.
- Alternatives considered: retornar `400` para id invalido ou `500` generico. Rejeitado por semantica HTTP inadequada para recurso inexistente.

## Decision 8: Sem retry automatico no toggle individual

- Decision: nao executar retry automatico em falhas temporarias no toggle de `pagamentoRealizado`; nova tentativa somente por acao explicita do usuario.
- Rationale: evita efeitos colaterais de repeticao automatica em operacao de mutacao, simplifica consistencia de UI e torna comportamento previsivel.
- Alternatives considered: retry imediato unico ou retry com backoff. Rejeitado por elevar risco de estado inesperado sem ganho proporcional para o fluxo.
