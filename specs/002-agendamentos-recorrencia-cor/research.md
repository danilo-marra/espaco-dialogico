# Research: Agendamentos - recorrencia e cores de status

## Decision 1: Sugestao padrao de fim da recorrencia com `date-fns/addMonths`

- Decision: calcular a data final sugerida com `addMonths(selectedDataAgendamento, 3)` no proprio modal, usando o estado do formulario como origem da verdade.
- Rationale: a regra precisa acompanhar o valor atual da data de inicio e permanecer sobrescrevivel pelo usuario, sem introduzir nova regra de backend.
- Alternatives considered: derivar o valor apenas em `defaultValues` do `useForm` ou mover a regra para schema/Redux. Essas opções foram rejeitadas porque nao lidam bem com edicao manual posterior e aumentariam acoplamento desnecessario.

## Decision 2: Atalho explicito no modal para preencher +3 meses

- Decision: expor um controle de acao proximo ao `DatePicker` que reaplica exatamente a mesma regra de tres meses.
- Rationale: o atalho atende usuarios que preferem confirmar visualmente a data final sem abrir calculadora mental e reduz erro de preenchimento.
- Alternatives considered: manter apenas o preenchimento automatico. Isso resolve o caso padrao, mas deixa sem acesso direto a mesma regra para quem quiser re-aplicar a sugestao apos ajustes.

## Decision 3: Cores/status na agenda por periodo devem reutilizar convencoes ja existentes

- Decision: ajustar `AgendaPeriodoPersonalizado.tsx` para tratar cancelado com vermelho, concluido/ausente com verde e confirmado sem conclusao com destaque neutro coerente com as demais visoes de agenda.
- Rationale: a issue aponta inconsistencia entre visoes; a melhor correcao e alinhar a visao por periodo ao mesmo vocabulario visual usado no resto da agenda.
- Alternatives considered: criar uma legenda nova ou inventar uma nova paleta. Isso foi rejeitado porque aumentaria friccao cognitiva e nao corrige a divergencia atual.

## Decision 4: Nao ha mudancas de API, model ou migracao

- Decision: limitar a entrega a componentes frontend e aos testes de regressao pertinentes.
- Rationale: o comportamento descrito pela issue e de apresentacao/fluxo; nao ha necessidade de persistir novos dados ou expor novos endpoints.
- Alternatives considered: adicionar campos novos para salvar preferencias de recorrencia. Isso nao e necessario para atender o problema e adicionaria custo de schema e compatibilidade.
