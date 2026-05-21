import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { describe, expect, test } from "@jest/globals";
import { AgendaMensal } from "components/Agendamento/AgendaMensal";
import { AgendaPeriodoPersonalizado } from "components/Agendamento/AgendaPeriodoPersonalizado";
import { AgendaPorTerapeuta } from "components/Agendamento/AgendaPorTerapeuta";
import { AgendaSemSala } from "components/Agendamento/AgendaSemSala";
import { AgendaSemanal } from "components/Agendamento/AgendaSemanal";
import { Agendamento } from "tipos";
import {
  createCanceladoAgendamento,
  createConfirmadoNeutroAgendamento,
  createSessaoRealizadaAgendamento,
} from "tests/frontend/agendamento/agendamentoTestData";

const BASE_DATE = new Date("2026-05-21T00:00:00.000Z");
const PATIENT_NAME = "Paciente Consistencia";
const THERAPIST_NAME = "Terapeuta Consistencia";

const noop = () => undefined;
const sortByTime = (a: Agendamento, b: Agendamento) =>
  a.horarioAgendamento.localeCompare(b.horarioAgendamento);

type AgendaView = "periodo" | "semanal" | "mensal" | "terapeuta" | "sem_sala";

type ExpectedSemantic =
  | "cancelado"
  | "concluido_ou_falta"
  | "confirmado_neutro";

function classifySemantic(className: string): ExpectedSemantic {
  if (className.includes("bg-red")) {
    return "cancelado";
  }

  if (className.includes("bg-green")) {
    return "concluido_ou_falta";
  }

  return "confirmado_neutro";
}

function withDisplayInfo(agendamento: Agendamento): Agendamento {
  return {
    ...agendamento,
    dataAgendamento: BASE_DATE,
    pacienteInfo: { nome: PATIENT_NAME } as any,
    terapeutaInfo: { id: "terapeuta-1", nome: THERAPIST_NAME } as any,
  };
}

function findStatusContainer(): HTMLElement {
  const patientNode = screen.getByText(PATIENT_NAME);
  let current: HTMLElement | null = patientNode as HTMLElement;

  while (current) {
    const className =
      typeof current.className === "string" ? current.className : "";
    if (current.tagName === "TR" || className.includes("cursor-pointer")) {
      return current;
    }

    current = current.parentElement;
  }

  throw new Error("Status container not found");
}

function getStatusClassName(
  view: AgendaView,
  agendamento: Agendamento,
): string {
  cleanup();

  const commonProps = {
    handleEditAgendamento: noop,
    handleDeleteClick: noop,
    handleDragStart: noop,
    handleDragOver: noop,
    handleDrop: noop,
    dragOverDate: null,
  };

  if (view === "periodo") {
    render(
      <AgendaPeriodoPersonalizado
        daysOfPeriod={[BASE_DATE]}
        agendamentos={[agendamento]}
        sortByTime={sortByTime}
        {...commonProps}
      />,
    );
  }

  if (view === "semanal") {
    render(
      <AgendaSemanal
        daysOfWeek={[BASE_DATE]}
        agendamentos={[agendamento]}
        sortByTime={sortByTime}
        onDayClick={noop}
        {...commonProps}
      />,
    );
  }

  if (view === "mensal") {
    render(
      <AgendaMensal
        daysOfMonth={[BASE_DATE]}
        selectedDate={BASE_DATE}
        agendamentos={[agendamento]}
        sortByTime={sortByTime}
        onDayClick={noop}
        {...commonProps}
      />,
    );
  }

  if (view === "terapeuta") {
    render(
      <AgendaPorTerapeuta
        agendamentosPorTerapeuta={[
          {
            terapeuta: { id: "terapeuta-1", nome: THERAPIST_NAME } as any,
            agendamentos: [agendamento],
          },
        ]}
        handleEditAgendamento={noop}
        handleDeleteClick={noop}
      />,
    );
  }

  if (view === "sem_sala") {
    render(
      <AgendaSemSala
        agendamentos={[
          {
            ...agendamento,
            localAgendamento: "Não Precisa de Sala",
          },
        ]}
        sortByTime={sortByTime}
        handleEditAgendamento={noop}
        handleDeleteClick={noop}
        handleDragStart={noop}
      />,
    );
  }

  return findStatusContainer().className;
}

describe("Agenda status consistency across views", () => {
  const views: AgendaView[] = [
    "periodo",
    "semanal",
    "mensal",
    "terapeuta",
    "sem_sala",
  ];

  const scenarios: Array<{
    label: string;
    agendamento: Agendamento;
    expected: ExpectedSemantic;
  }> = [
    {
      label: "cancelado",
      agendamento: withDisplayInfo(createCanceladoAgendamento()),
      expected: "cancelado",
    },
    {
      label: "concluido_ou_falta",
      agendamento: withDisplayInfo(createSessaoRealizadaAgendamento()),
      expected: "concluido_ou_falta",
    },
    {
      label: "confirmado_neutro",
      agendamento: withDisplayInfo(createConfirmadoNeutroAgendamento()),
      expected: "confirmado_neutro",
    },
  ];

  test.each(scenarios)(
    "deve manter semantica %s nas cinco visoes",
    ({ agendamento, expected }) => {
      views.forEach((view) => {
        const className = getStatusClassName(view, agendamento);
        expect(classifySemantic(className)).toBe(expected);
      });
    },
  );
});
