# Quickstart: Sessoes - status de pagamento e cobertura de integracao

## Goal

Validar alteracao de status de pagamento (`pagamentoRealizado`) de Sessao por checkbox e confirmar cobertura de integracao dos cenarios criticos.

## Preconditions

1. Ambiente de desenvolvimento ativo com banco e migracoes aplicadas.
2. Usuario autenticado com permissao de acesso ao modulo de Sessoes.
3. Pelo menos uma Sessao existente para teste.

## Manual Validation

1. Abrir Dashboard de Sessoes.
2. Localizar uma Sessao e identificar o novo checkbox individual de status de pagamento.
3. Marcar ou desmarcar o checkbox.
4. Confirmar feedback de sucesso e atualizacao visual no item.
5. Recarregar a pagina e validar que o valor persiste.
6. Repetir com usuario sem permissao e validar bloqueio com feedback de erro e sem divergencia visual.
7. Simular sessao inexistente e validar retorno `404` com feedback compreensivel e rollback visual.
8. Simular falha de persistencia e validar rollback visual para o ultimo estado valido sem retry automatico.

## Integration Test Validation

1. Executar suite dedicada de Sessoes:
   - `npm run test:single -- tests/integration/api/v1/sessoes/put-status-success.test.js`
   - `npm run test:single -- tests/integration/api/v1/sessoes/put-status-errors.test.js`
   - `npm run test:single -- tests/integration/api/v1/sessoes/put-status-consistency.test.js`
2. Repetir a execucao da suite dedicada (mesmos comandos) para totalizar duas execucoes consecutivas sem falhas.
3. Registrar no proprio quickstart as evidencias das duas execucoes (data/hora e resultado geral).
4. Validar cobertura dos cenarios:
   - sucesso de alteracao
   - permissao negada
   - sessao inexistente (`404`)
   - falha interna de persistencia
   - consistencia do dado apos sucesso
5. Executar validacao padrao de regressao:
   - `npm run test`

## Error Message Matrix (403/404/500)

- `403`: `Acesso negado` (retornado por `requirePermission("sessoes")`).
- `404`: `NotFoundError` com mensagem `Sessão não encontrada`.
- `500`: `Erro interno ao atualizar sessão` para falha interna de persistencia.

## Execution Evidence

- `2026-05-21` - Run 1 (suite dedicada de Sessoes): PASS
  - comando: `npm run test:single -- tests/integration/api/v1/sessoes/put-status-success.test.js tests/integration/api/v1/sessoes/put-status-errors.test.js tests/integration/api/v1/sessoes/put-status-consistency.test.js`
  - resultado: `3 suites, 6 testes, 0 falhas`
- `2026-05-21` - Run 2 (suite dedicada de Sessoes): PASS
  - comando: `npm run test:single -- tests/integration/api/v1/sessoes/put-status-success.test.js tests/integration/api/v1/sessoes/put-status-errors.test.js tests/integration/api/v1/sessoes/put-status-consistency.test.js`
  - resultado: `3 suites, 6 testes, 0 falhas`
- `2026-05-21` - Frontend status checkbox: PASS
  - comando: `npm run test:single -- tests/frontend/components/sessoes/SessoesTable.status-checkbox.test.tsx`
  - resultado: `1 suite, 3 testes, 0 falhas`

## Final Validation Checklist

- Roteiro final executado para cenarios criticos via suites automatizadas dedicadas.
- Escopo fora de Nota Fiscal validado pelo teste de consistencia: alteracao de `pagamentoRealizado` nao altera `notaFiscal`.
- Concorrencia `last-write-wins` validada com duas atualizacoes quase simultaneas e verificacao do estado persistido final.

## Expected Outcome

- Alteracao de status de pagamento por checkbox funciona para usuarios autorizados.
- Operacoes sem permissao sao bloqueadas corretamente.
- Sessao inexistente retorna `404` e nao deixa UI inconsistente.
- Falhas de persistencia nao deixam UI inconsistente e nao disparam retry automatico.
- Cenarios criticos de Sessoes ficam cobertos por testes de integracao estaveis.
