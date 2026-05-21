# Data Model: Agendamentos - recorrencia e cores de status

## Entities

### Agendamento

- Represents: compromisso exibido no modal e nas visoes de agenda.
- Relevant fields: `dataAgendamento`, `periodicidade`, `dataFimRecorrencia`, `diasDaSemana`, `statusAgendamento`, `sessaoRealizada`, `falta`.
- Rules:
  - `dataFimRecorrencia` can be auto-suggested when periodicidade is different from `Não repetir`.
  - Manual edits to `dataFimRecorrencia` must remain intact after the suggestion is applied.
  - `statusAgendamento` drives visual treatment in agenda period view.

### Configuracao de Recorrencia

- Represents: the transient form state that defines repetition rules for a new or edited appointment.
- Fields:
  - `periodicidade`: `Não repetir` | `Semanal` | `Quinzenal`
  - `dataAgendamento`: base date used for the default suggestion
  - `dataFimRecorrencia`: suggested or manually selected end date
  - `diasDaSemana`: selected weekdays for recurring creation
- Rules:
  - If recurrence is active and end date is absent, default suggestion is `dataAgendamento + 3 months`.
  - The shortcut action must set the same computed value.

### Status Visual da Agenda

- Represents: presentation-layer state derived from `statusAgendamento`, `sessaoRealizada`, and `falta`.
- States:
  - `cancelado` -> red emphasis
  - `concluido_ou_falta` -> green emphasis
  - `confirmado_neutro` -> neutral emphasis used by the agenda views
- Rules:
  - The visual mapping is a view concern and does not change persisted data.
  - The same semantic meaning must be preserved across agenda variants.

## Relationships

- `Agendamento` owns the recurrence fields used by the modal.
- `Status Visual da Agenda` is derived from `Agendamento` data and is not stored separately.

## State Transitions

- `periodicidade = Não repetir` -> no recurrence end-date suggestion required.
- `periodicidade != Não repetir` and `dataFimRecorrencia = null` -> auto-suggest +3 months.
- User override of `dataFimRecorrencia` -> suggestion stops being authoritative until the field is cleared again.
