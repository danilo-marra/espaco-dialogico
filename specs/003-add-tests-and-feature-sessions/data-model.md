# Data Model: Sessoes - status de pagamento e cobertura de integracao

## Entities

### Sessao

- Represents: atendimento clinico individual associado a paciente e terapeuta.
- Relevant fields:
  - `id`
  - `terapeuta_id`
  - `paciente_id`
  - `agendamento_id`
  - `pagamentoRealizado`
  - `repasseRealizado`
  - `notaFiscal`
  - `updated_at`
- Rules:
  - `id` deve referenciar um registro existente para atualizacao.
  - Alteracao de status de pagamento nao deve modificar campos fora do payload pretendido.
  - `updated_at` deve refletir alteracao persistida.

### StatusPagamentoSessao

- Represents: estado mutavel do checkbox individual no item de Sessao.
- Fields:
  - `sessaoId`
  - `pagamentoRealizado` (boolean)
  - `estadoUI` (idle | loading | success | error)
  - `valorAnterior` (para rollback em falha)
- Rules:
  - Em sucesso, UI e persistencia convergem para o novo valor.
  - Em erro, UI retorna para `valorAnterior` e exibe feedback.
  - Em permissao negada, UI nao deve manter alteracao local inconsistente.
  - Durante `loading`, checkbox do item permanece desabilitado e cliques adicionais sao ignorados.
  - Nao ha retry automatico de mutacao apos erro; nova tentativa depende de acao do usuario.

### ResultadoAtualizacaoSessao

- Represents: resposta de API para update individual de Sessao.
- Fields:
  - `id`
  - `pagamentoRealizado`
  - `updated_at`
  - demais campos da Sessao retornados no contrato atual
- Rules:
  - Em sucesso retorna Sessao atualizada (200).
  - Em autorizacao negada retorna erro de autorizacao (403).
  - Em sessao inexistente retorna recurso nao encontrado (404).
  - Em falha interna retorna erro padronizado (500).

### ContextoPermissaoSessao

- Represents: contexto de autorizacao para operacao de update.
- Fields:
  - `user.id`
  - `user.role`
  - `resource = "sessoes"`
  - `action = "update"`
- Rules:
  - Recurso `sessoes` deve aplicar middleware de permissao.
  - Apenas perfis `admin` e `secretaria` podem executar update de `pagamentoRealizado` nesta feature.
  - Usuario autenticado sem permissao recebe bloqueio antes da persistencia.

## Relationships

- `StatusPagamentoSessao` referencia exatamente uma `Sessao` por `sessaoId`.
- `ResultadoAtualizacaoSessao` representa o estado persistido da `Sessao` apos mutacao.
- `ContextoPermissaoSessao` governa se a mutacao de `StatusPagamentoSessao` pode ocorrer.

## State Transitions

1. `idle` -> `loading`: usuario marca/desmarca checkbox de pagamento.
2. `loading` -> `success`: API confirma persistencia e UI consolida novo valor.
3. `loading` -> `error`: API retorna erro e UI reverte para valor anterior.
4. `error` -> `idle`: usuario recebe feedback e pode tentar novamente.
