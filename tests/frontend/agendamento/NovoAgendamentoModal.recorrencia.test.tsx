import {
  getDataFimRecorrenciaPlusThreeMonths,
  shouldAutoFillDataFimRecorrencia,
} from "components/Agendamento/NovoAgendamentoModal";

describe("NovoAgendamentoModal recorrencia", () => {
  test("deve sugerir data fim automatica quando recorrencia estiver ativa e campo vazio", () => {
    const dataAgendamento = new Date("2026-01-15T00:00:00.000Z");
    const shouldAutoFill = shouldAutoFillDataFimRecorrencia({
      periodicidade: "Semanal",
      dataAgendamento,
      dataFimRecorrencia: null,
      dataFimRecorrenciaFoiEditadaManualmente: false,
    });

    const suggestedDate = getDataFimRecorrenciaPlusThreeMonths(dataAgendamento);

    expect(shouldAutoFill).toBe(true);
    expect(suggestedDate).not.toBeNull();
    expect(suggestedDate?.toISOString().slice(0, 10)).toBe("2026-04-15");
  });

  test("deve aplicar o mesmo calculo do atalho Proximos 3 meses", () => {
    const dataAgendamento = new Date("2026-02-01T00:00:00.000Z");

    const suggestedDate = getDataFimRecorrenciaPlusThreeMonths(dataAgendamento);

    expect(suggestedDate).not.toBeNull();
    expect(suggestedDate?.toISOString().slice(0, 10)).toBe("2026-05-01");
  });

  test("deve preservar valor manual e impedir novo preenchimento automatico", () => {
    const dataAgendamento = new Date("2026-03-10T00:00:00.000Z");
    const valorManual = new Date("2026-06-20T00:00:00.000Z");

    const shouldAutoFill = shouldAutoFillDataFimRecorrencia({
      periodicidade: "Quinzenal",
      dataAgendamento,
      dataFimRecorrencia: valorManual,
      dataFimRecorrenciaFoiEditadaManualmente: true,
    });

    expect(shouldAutoFill).toBe(false);
  });

  test("deve recalcular data fim automatica quando a data inicial muda", () => {
    const dataAgendamento = new Date("2026-04-10T00:00:00.000Z");
    const valorPreenchidoAutomaticamente = new Date("2026-06-10T00:00:00.000Z");

    const shouldAutoFill = shouldAutoFillDataFimRecorrencia({
      periodicidade: "Semanal",
      dataAgendamento,
      dataFimRecorrencia: valorPreenchidoAutomaticamente,
      dataFimRecorrenciaFoiEditadaManualmente: false,
    });

    expect(shouldAutoFill).toBe(true);
  });
});
