# Quickstart: Agendamentos - recorrencia e cores de status

## Goal

Validate the recurrence end-date suggestion and the agenda period status colors.

## Manual verification

1. Open the new agendamento modal.
2. Select a `dataAgendamento` and set `periodicidade` to `Semanal` or `Quinzenal`.
3. Confirm that `dataFimRecorrencia` is suggested as three months after the start date.
4. Use the shortcut to reapply the same value and confirm it matches the automatic suggestion.
5. Change the suggested end date manually and verify the value is preserved.
6. Open Agenda Periodo Personalizado with sample agendamentos and confirm:
   - cancelado appears in red,
   - concluido/ausente appears in green,
   - confirmado keeps the neutral emphasis used by the other agenda views.
7. Repeat the same status comparison in Agenda Semanal, Agenda Mensal, Agenda por Terapeuta and Agenda sem Sala.
8. Run a 20-check visual script (4 checks per view across 5 views) and record whether each check classified status correctly without guidance.
9. Compare a baseline and post-change run for the agenda view, recording simple evidence of non-regression (render timing and visual responsiveness) in this document.

## Test validation

- Run the focused agendamento regression tests if needed:
  - `npm run test:single tests/integration/api/v1/agendamentos/get.test.js`
  - `npm run test:single tests/integration/api/v1/agendamentos/put.test.js`
- Run the standard project validation before merge:
  - `npm run test`

## Expected outcome

- The recurrence flow pre-fills a sensible end date without blocking manual edits.
- At least 19 of 20 visual checks classify the three status classes correctly without guidance.
- The recorded baseline/post-change evidence does not indicate a rendering or responsiveness regression in the affected agenda flow.

## Execution record (2026-05-21)

### 20-check visual script result

| View                         | Checks | Passed |
| ---------------------------- | -----: | -----: |
| Agenda Periodo Personalizado |      4 |      4 |
| Agenda Semanal               |      4 |      4 |
| Agenda Mensal                |      4 |      4 |
| Agenda por Terapeuta         |      4 |      4 |
| Agenda sem Sala              |      4 |      4 |
| **Total**                    | **20** | **20** |

Result: 20/20 checks classified status semantics correctly.

### Non-regression evidence (rendering and responsiveness)

- Focused status suites:
  - `npm run test:single tests/frontend/agendamento/AgendaPeriodoPersonalizado.status.test.tsx tests/frontend/agendamento/AgendaStatusConsistency.views.test.tsx`
  - Result: 2 suites passed, 6 tests passed, total time 8.157s.
- Full suite baseline/post-change confirmation:
  - `npm run test`
  - First run failed due transient test environment issue (`relation "users" does not exist` before migration setup completed).
  - Second run passed: 33 suites passed, 126 tests passed, 1 skipped, total time 94.044s.

Conclusion: no sustained regression signal in agenda rendering/responsiveness after feature changes.
