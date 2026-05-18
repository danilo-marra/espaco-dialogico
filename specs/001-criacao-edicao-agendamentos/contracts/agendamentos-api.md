# Contract: API de Agendamentos

Base path: `/api/v1/agendamentos`

## POST /

Descrição:

- cria um agendamento simples

Request body (mínimo):

- `paciente_id` (uuid)
- `terapeuta_id` (uuid)
- `dataAgendamento` (YYYY-MM-DD)
- `horarioAgendamento` (HH:mm)

Campos relevantes adicionais:

- `localAgendamento`, `modalidadeAgendamento`, `tipoAgendamento`, `valorAgendamento`, `statusAgendamento`
- `sessaoRealizada` (boolean)
- `falta` (boolean)

Responses:

- `201`: agendamento criado
- `400/422`: erro de validação
- `401`: não autenticado
- `403`: autenticado sem permissão/acesso ao recurso

## PUT /:id/

Descrição:

- atualiza um agendamento específico

Campos suportados (subset):

- todos os campos de criação
- flags: `sessaoRealizada`, `falta`
- recorrência: `updateAllRecurrences` (compatível com `updateAllRecorrences`), `recurrenceId`, `novoDiaSemana`

Responses:

- `200`: agendamento atualizado
- `401`: não autenticado
- `403`: autenticado sem acesso ao recurso (quando aplicável)
- `422`: `localAgendamento` inválido
- `500`: erro inesperado

## GET /

Descrição:

- lista agendamentos

Response `200`:

- array de objetos com ao menos:
  - `id`
  - `paciente_id`
  - `terapeuta_id`
  - `dataAgendamento`
  - `horarioAgendamento`
  - `sessaoRealizada`
  - `falta`

Erros esperados:

- `401`: não autenticado
- `403`: autenticado sem permissão (limitação conhecida para reprodução em testes no modelo atual)

## POST /recurrences/:id/

Descrição:

- cria lote de agendamentos recorrentes

Request body:

- `agendamentoBase`
- `diasDaSemana`
- `dataFimRecorrencia`
- `periodicidade`

Responses:

- `201`: recorrência criada
- `400`: payload inválido
- `401`: não autenticado

## PUT /recurrences/:id/

Descrição:

- atualiza lote da recorrência quando habilitado

Request body:

- `updateAllRecurrences=true` (ou `updateAllRecorrences=true` por compatibilidade)
- campos a atualizar

Responses:

- `200`: lote atualizado
- `400`: sem flag de atualização em massa
- `500`: erro inesperado
