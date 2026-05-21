import {
  getAgendamentoCardStatusClass,
  getAgendamentoStatusAppearance,
} from "components/Agendamento/agendamentoStatusAppearance";
import {
  createCanceladoAgendamento,
  createConfirmadoNeutroAgendamento,
  createFaltaAgendamento,
  createSessaoRealizadaAgendamento,
} from "tests/frontend/agendamento/agendamentoTestData";

describe("agendamentoStatusAppearance", () => {
  test("deve mapear cancelado para tom vermelho com line-through", () => {
    const agendamento = createCanceladoAgendamento();

    const appearance = getAgendamentoStatusAppearance(agendamento);
    const className = getAgendamentoCardStatusClass(agendamento);

    expect(appearance.tone).toBe("cancelado");
    expect(appearance.backgroundClass).toBe("bg-red-100");
    expect(appearance.textDecorationClass).toBe("line-through");
    expect(className).toContain("bg-red-100");
    expect(className).toContain("line-through");
  });

  test("deve mapear sessao realizada para tom verde", () => {
    const agendamento = createSessaoRealizadaAgendamento();

    const appearance = getAgendamentoStatusAppearance(agendamento);
    const className = getAgendamentoCardStatusClass(agendamento);

    expect(appearance.tone).toBe("concluido_ou_falta");
    expect(appearance.backgroundClass).toBe("bg-green-100");
    expect(className).toContain("bg-green-100");
    expect(className).not.toContain("line-through");
  });

  test("deve mapear falta para tom verde", () => {
    const agendamento = createFaltaAgendamento();

    const appearance = getAgendamentoStatusAppearance(agendamento);

    expect(appearance.tone).toBe("concluido_ou_falta");
    expect(appearance.backgroundClass).toBe("bg-green-100");
  });

  test("deve manter confirmado sem destaque de fundo", () => {
    const agendamento = createConfirmadoNeutroAgendamento();

    const appearance = getAgendamentoStatusAppearance(agendamento);
    const className = getAgendamentoCardStatusClass(agendamento);

    expect(appearance.tone).toBe("confirmado_neutro");
    expect(appearance.backgroundClass).toBe("");
    expect(appearance.textDecorationClass).toBe("");
    expect(className).toBe("");
  });
});
