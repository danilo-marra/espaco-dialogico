# Validacao GET /api/v1/agendamentos

## Contexto

Esta nota registra a adicao de testes de integracao para o endpoint de listagem de agendamentos em cenario padrao.

Arquivo de teste criado:

- tests/integration/api/v1/agendamentos/get.test.js

## Cobertura implementada

- GET /api/v1/agendamentos/ retorna 200 para usuario autenticado e autorizado.
- Estrutura minima validada por item: id, paciente_id, terapeuta_id, dataAgendamento, horarioAgendamento.
- GET sem autenticacao retorna 401.
- GET com token invalido retorna 401.

## Observacao sobre cenario 403

O cenario 403 para usuario autenticado sem permissao no recurso ficou registrado como teste `skip`.

Motivo:

- No modelo atual de roles persistiveis (admin, secretaria, terapeuta), todas as roles validas possuem permissao para `agendamentos`.
- Nao existe, no estado atual da aplicacao, uma role autenticavel sem acesso a esse recurso para reproduzir 403 de forma realista no GET padrao.

## Proximo passo sugerido

Para transformar o cenario 403 em teste executavel sem `skip`, e necessario:

- introduzir uma role autenticavel sem permissao em `agendamentos`, ou
- alterar a politica de permissao vigente para um dos perfis existentes.
