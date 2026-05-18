# Research: Criação e edição de agendamentos

## Decision 1: Persistência de `sessaoRealizada` e `falta` deve ser tratada como boolean explícito ponta a ponta

**Rationale**:

- o fluxo de edição passa por modal, Redux thunk, API route e model
- qualquer normalização implícita pode mascarar `false` no retorno visual
- garantir coerção explícita reduz divergência entre UI e banco

**Alternatives considered**:

- confiar só em defaults no backend: rejeitado por não resolver inconsistência de UI/cache
- mapear somente `sessao_realizada` no frontend: rejeitado por aumentar acoplamento com formato de banco

## Decision 2: Revalidação de agenda deve usar cache key explícita de agendamentos após PUT

**Rationale**:

- a agenda combina SWR e mutações Redux
- compare custom com poucos campos pode não refletir mudanças de checkbox imediatamente
- invalidar `/agendamentos/` junto de `fetchAgendamentos` e `/sessoes` garante consistência visual

**Alternatives considered**:

- apenas `dispatch(fetchAgendamentos())`: rejeitado por ainda depender de compare de SWR na tela consumidora
- remover compare custom do hook: rejeitado por potencial impacto de performance em renderizações

## Decision 3: Contrato de recorrência deve aceitar variação histórica de flag de atualização em massa

**Rationale**:

- existe variação de nomenclatura (`updateAllRecurrences` vs `updateAllRecorrences`)
- compatibilidade evita falhas silenciosas no PUT de recorrência

**Alternatives considered**:

- quebrar compatibilidade e aceitar apenas um nome: rejeitado por risco de regressão frontend/backend

## Decision 4: Cenário GET 403 autenticado sem permissão permanece limitação conhecida do modelo atual de roles

**Rationale**:

- no modelo atual, roles válidas autenticáveis possuem permissão de agendamentos
- não há perfil realista para reproduzir 403 sem alterar autorização de produto

**Alternatives considered**:

- forçar usuário inválido em teste: rejeitado por não representar regra real de negócio
- alterar matriz de permissões no escopo atual: rejeitado por ampliar escopo funcional da feature
