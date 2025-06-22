import { z } from "zod";

// Esquema para edição de sessões
export const SessaoEditSchema = z.object({
  terapeuta_id: z.string().optional(),
  paciente_id: z.string().optional(),
  tipoSessao: z.enum(
    ["Anamnese", "Atendimento", "Avaliação", "Visitar Escolar"],
    {
      required_error: "Selecione o tipo de sessão",
    },
  ),
  valorSessao: z
    .number({
      required_error: "Informe o valor da sessão",
    })
    .positive("O valor deve ser maior que zero"),
  valorRepasse: z.number().nullable().optional(),
  statusSessao: z.enum(
    [
      "Pagamento Pendente",
      "Pagamento Realizado",
      "Nota Fiscal Emitida",
      "Nota Fiscal Enviada",
    ],
    {
      required_error: "Selecione o status da sessão",
    },
  ),
});

export type SessaoEditFormInputs = z.infer<typeof SessaoEditSchema>;
