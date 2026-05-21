# Contract: Sessoes - alteracao de status de pagamento

## Scope

Contrato funcional para alteracao de status de pagamento (`pagamentoRealizado`) de Sessao via checkbox e para cobertura de integracao da API de Sessoes.

## UI Contract

### Item-level checkbox behavior

- Cada item de Sessao exibido na lista deve disponibilizar checkbox para status de pagamento (`pagamentoRealizado`).
- Apenas usuarios com perfil `admin` ou `secretaria` podem efetivar alteracao de `pagamentoRealizado`.
- Ao alterar o checkbox, a interface deve:
  - enviar mutacao para a API de Sessoes,
  - apresentar feedback de sucesso/erro,
  - manter consistencia visual com o estado persistido.
  - desabilitar o checkbox do item durante requisicao pendente, ignorando cliques adicionais.

### Error and rollback behavior

- Em erro de autorizacao ou falha interna, o checkbox deve retornar ao ultimo valor persistido.
- O usuario deve receber mensagem de erro compreensivel sem recarregar toda a pagina.
- Em falha temporaria, nao deve haver retry automatico; nova tentativa ocorre por acao manual do usuario.

## API Contract

### Endpoint

- `PUT /api/v1/sessoes/{id}`

### Request (partial update)

```json
{
  "pagamentoRealizado": true
}
```

### Success response

- Status: `200`
- Body: objeto de Sessao atualizado, incluindo `id`, `pagamentoRealizado` e campos do contrato atual.

### Authorization failure

- Status: `403`
- Body: erro padronizado de autorizacao.

### Resource not found

- Status: `404`
- Body: erro padronizado indicando sessao inexistente para o `id` informado.

### Authentication failure

- Status: `401`
- Body: erro padronizado de autenticacao.

### Persistence/internal failure

- Status: `500`
- Body: erro padronizado sem deixar a UI inconsistente.

## Integration Test Contract

A suite de integracao de Sessoes deve cobrir minimamente:

1. Sucesso na alteracao de status de pagamento (`pagamentoRealizado`).
2. Bloqueio por permissao.
3. Sessao inexistente com retorno `404`.
4. Falha interna de persistencia.
5. Verificacao de consistencia do dado persistido apos sucesso.

## Non-goals

- Alteracoes no fluxo de Nota Fiscal.
- Refatoracao ampla fora do modulo de Sessoes.
- Criacao de novo schema/migration para esta feature.
