# Data Model: Criação e edição de agendamentos

## Entity: Agendamento

Campos principais:

- `id` (uuid, PK)
- `paciente_id` (uuid, FK -> pacientes)
- `terapeuta_id` (uuid, FK -> terapeutas)
- `recurrence_id` (uuid nullable)
- `data_agendamento` (date)
- `horario_agendamento` (string HH:mm)
- `local_agendamento` (enum validado)
- `modalidade_agendamento` (Presencial | Online)
- `tipo_agendamento` (enum de tipos clínicos)
- `valor_agendamento` (numeric)
- `status_agendamento` (Confirmado | Cancelado)
- `observacoes_agendamento` (text nullable)
- `sessao_realizada` (boolean)
- `falta` (boolean)
- `created_at`, `updated_at`

Validações relevantes:

- `paciente_id`, `terapeuta_id` obrigatórios e UUID válidos
- `data_agendamento` obrigatória
- `local_agendamento` dentro do conjunto permitido
- se `status_agendamento = Cancelado`, sessão associada deve ser removida

## Entity: Sessao

Campos principais (subset relevante ao fluxo):

- `id` (uuid, PK)
- `agendamento_id` (uuid, FK -> agendamentos)
- `paciente_id` (uuid)
- `terapeuta_id` (uuid)
- `tipo_sessao`
- `valor_sessao`
- `status_sessao`

Regra de vínculo:

- criar/atualizar sessão quando `sessao_realizada` ou `falta` estiverem ativos e agendamento não cancelado
- remover sessão associada quando ambos falsos ou quando agendamento for cancelado

## Entity: Recorrencia (lógica)

Representada por `recurrence_id` em múltiplos agendamentos.

Campos de entrada para criação/edição em massa:

- `diasDaSemana` (array)
- `dataFimRecorrencia` (date)
- `periodicidade` (Semanal | Quinzenal)

Restrições:

- limite operacional de criação em massa (até 35 ocorrências)
- atualização em massa condicionada por flag de contrato (`updateAllRecurrences` compatível com variação legada)

## State Transitions

1. Agendamento criado

- estado inicial típico: `status_agendamento=Confirmado`, `sessao_realizada=false`, `falta=false`

2. Marcação de sessão/falta

- transição: (`false,false`) -> (`true,false`) ou (`false,true`) ou (`true,true`)
- efeito: sessão associada deve existir/ser atualizada

3. Desmarcação de sessão/falta

- transição: qualquer estado -> (`false,false`)
- efeito: sessão associada deve ser removida

4. Cancelamento

- transição: `status_agendamento=Cancelado`
- efeito: remover sessão associada e manter coerência das flags
