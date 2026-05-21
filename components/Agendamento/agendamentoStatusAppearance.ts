import { Agendamento } from "tipos";

type StatusTone = "cancelado" | "concluido_ou_falta" | "confirmado_neutro";

type StatusAppearance = {
  tone: StatusTone;
  backgroundClass: string;
  textDecorationClass: string;
};

type StatusInput = Pick<
  Agendamento,
  "statusAgendamento" | "sessaoRealizada" | "falta"
>;

const STATUS_APPEARANCE: Record<StatusTone, StatusAppearance> = {
  cancelado: {
    tone: "cancelado",
    backgroundClass: "bg-red-100",
    textDecorationClass: "line-through",
  },
  concluido_ou_falta: {
    tone: "concluido_ou_falta",
    backgroundClass: "bg-green-100",
    textDecorationClass: "",
  },
  confirmado_neutro: {
    tone: "confirmado_neutro",
    backgroundClass: "",
    textDecorationClass: "",
  },
};

export function getAgendamentoStatusAppearance(
  agendamento: StatusInput,
): StatusAppearance {
  if (agendamento.statusAgendamento === "Cancelado") {
    return STATUS_APPEARANCE.cancelado;
  }

  if (agendamento.sessaoRealizada || agendamento.falta) {
    return STATUS_APPEARANCE.concluido_ou_falta;
  }

  return STATUS_APPEARANCE.confirmado_neutro;
}

export function getAgendamentoCardStatusClass(
  agendamento: StatusInput,
): string {
  const { backgroundClass, textDecorationClass } =
    getAgendamentoStatusAppearance(agendamento);
  return `${backgroundClass} ${textDecorationClass}`.trim();
}
