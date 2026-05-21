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
  createFaltaAgendamento,
} from "tests/frontend/agendamento/agendamentoTestData";

const BASE_DATE = new Date("2026-05-21T00:00:00.000Z");
const PATIENT_NAME = "Paciente Teste";
const THERAPIST_NAME = "Terapeuta Teste";

const noop = () => undefined;
const sortByTime = (a: Agendamento, b: Agendamento) =>
  a.horarioAgendamento.localeCompare(b.horarioAgendamento);

type AgendaView = "periodo" | "semanal" | "mensal" | "terapeuta" | "sem_sala";

function withDisplayInfo(agendamento: Agendamento): Agendamento {
  return {
    ...agendamento,
    pacienteInfo: { nome: PATIENT_NAME } as any,
    terapeutaInfo: { id: "terapeuta-1", nome: THERAPIST_NAME } as any,
    dataAgendamento: BASE_DATE,
  };
}

function classifySemantic(className: string): string {
  if (className.includes("bg-red")) {
    return "cancelado";
  }

  if (className.includes("bg-green")) {
    return "concluido_ou_falta";
  }

  return "confirmado_neutro";
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

function renderView(view: AgendaView, agendamento: Agendamento): string {
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

describe("AgendaPeriodoPersonalizado status", () => {
  const viewsToCompare: AgendaView[] = [
    "semanal",
    "mensal",
    "terapeuta",
    "sem_sala",
  ];

  test("deve aplicar semantica vermelha para cancelado e manter consistencia com as demais visoes", () => {
    const agendamento = withDisplayInfo(createCanceladoAgendamento());

    const periodoClass = renderView("periodo", agendamento);
    const periodoSemantic = classifySemantic(periodoClass);

    expect(periodoClass).toContain("bg-red-100");
    expect(periodoClass).toContain("line-through");
    expect(periodoSemantic).toBe("cancelado");

    viewsToCompare.forEach((view) => {
      const className = renderView(view, agendamento);
      expect(classifySemantic(className)).toBe("cancelado");
    });
  });

  test("deve aplicar semantica verde para sessao realizada ou falta e manter consistencia com as demais visoes", () => {
    const agendamento = withDisplayInfo(createFaltaAgendamento());

    const periodoClass = renderView("periodo", agendamento);
    const periodoSemantic = classifySemantic(periodoClass);

    expect(periodoClass).toContain("bg-green-100");
    expect(periodoSemantic).toBe("concluido_ou_falta");

    viewsToCompare.forEach((view) => {
      const className = renderView(view, agendamento);
      expect(classifySemantic(className)).toBe("concluido_ou_falta");
    });
  });

  test("deve manter confirmado com semantica neutra e consistente com as demais visoes", () => {
    const agendamento = withDisplayInfo(createConfirmadoNeutroAgendamento());

    const periodoClass = renderView("periodo", agendamento);
    const periodoSemantic = classifySemantic(periodoClass);

    expect(periodoClass).not.toContain("bg-red");
    expect(periodoClass).not.toContain("bg-green");
    expect(periodoSemantic).toBe("confirmado_neutro");

    viewsToCompare.forEach((view) => {
      const className = renderView(view, agendamento);
      expect(classifySemantic(className)).toBe("confirmado_neutro");
    });
  });
});
