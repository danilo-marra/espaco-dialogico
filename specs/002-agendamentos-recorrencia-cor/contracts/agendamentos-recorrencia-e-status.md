# Contract: Agendamentos - recorrencia e cores de status

## Scope

This contract documents the UI behavior and visual rules touched by issue 147. No new API route or persisted schema is introduced.

## UI Contract 1: Recurrence End Date Suggestion

- When `periodicidade !== "Não repetir"` and `dataFimRecorrencia` is empty, the UI must suggest `dataAgendamento + 3 months`.
- The shortcut action near the date picker must apply the same computed value.
- If the user changes `dataFimRecorrencia` manually, the UI must preserve that value until the field is cleared again.

## UI Contract 2: Agenda Period Status Mapping

- `Cancelado` must render with red emphasis.
- `sessaoRealizada` or `falta` states must render with green emphasis.
- Confirmed appointments without completion/failure should keep the neutral emphasis used by the rest of the agenda.

## Non-Goals

- No persistence of user-specific recurrence defaults.
- No new backend validation rules.
- No change to existing auth, roles, or API response schemas.
