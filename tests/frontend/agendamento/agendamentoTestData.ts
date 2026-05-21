import { Agendamento } from "tipos";

type AgendamentoOverrides = Partial<Agendamento>;

export function createAgendamento(
  overrides: AgendamentoOverrides = {},
): Agendamento {
  return {
    id: "agendamento-1",
    paciente_id: "paciente-1",
    terapeuta_id: "terapeuta-1",
    dataAgendamento: new Date("2026-05-21T09:00:00.000Z"),
    horarioAgendamento: "09:00",
    localAgendamento: "Sala Verde",
    modalidadeAgendamento: "Presencial",
    tipoAgendamento: "Sessão",
    valorAgendamento: 150,
    statusAgendamento: "Confirmado",
    observacoesAgendamento: "",
    sessaoRealizada: false,
    falta: false,
    ...overrides,
  };
}

export function createCanceladoAgendamento(
  overrides: AgendamentoOverrides = {},
): Agendamento {
  return createAgendamento({
    id: "agendamento-cancelado",
    statusAgendamento: "Cancelado",
    ...overrides,
  });
}

export function createSessaoRealizadaAgendamento(
  overrides: AgendamentoOverrides = {},
): Agendamento {
  return createAgendamento({
    id: "agendamento-realizada",
    sessaoRealizada: true,
    falta: false,
    ...overrides,
  });
}

export function createFaltaAgendamento(
  overrides: AgendamentoOverrides = {},
): Agendamento {
  return createAgendamento({
    id: "agendamento-falta",
    sessaoRealizada: false,
    falta: true,
    ...overrides,
  });
}

export function createConfirmadoNeutroAgendamento(
  overrides: AgendamentoOverrides = {},
): Agendamento {
  return createAgendamento({
    id: "agendamento-confirmado-neutro",
    statusAgendamento: "Confirmado",
    sessaoRealizada: false,
    falta: false,
    ...overrides,
  });
}
