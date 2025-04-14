import { z } from "zod";

// Esquema para criação de novas sessões
export const SessaoFormSchema = z.object({
  terapeuta_id: z.string({
    required_error: "Terapeuta é obrigatório",
  }),
  paciente_id: z.string({
    required_error: "Paciente é obrigatório",
  }),
  tipoSessao: z.enum(
    ["Anamnese", "Atendimento", "Avaliação", "Visitar Escolar"],
    {
      required_error: "Tipo de sessão é obrigatório",
    },
  ),
  valorSessao: z.number({
    required_error: "Valor da sessão é obrigatório",
  }),
  valorRepasse: z.number().optional(),
  statusSessao: z.enum(
    [
      "Pagamento Pendente",
      "Pagamento Realizado",
      "Nota Fiscal Emitida",
      "Nota Fiscal Enviada",
    ],
    {
      required_error: "Status da sessão é obrigatório",
    },
  ),
  dtSessao1: z
    .date({
      required_error: "Data da primeira sessão é obrigatória",
    })
    .nullable(),
  dtSessao2: z.date().optional().nullable(),
  dtSessao3: z.date().optional().nullable(),
  dtSessao4: z.date().optional().nullable(),
  dtSessao5: z.date().optional().nullable(),
  dtSessao6: z.date().optional().nullable(),
});

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
  dtSessao1: z.date({
    required_error: "Informe a data da 1ª sessão",
  }),
  dtSessao2: z.date().nullable().optional(),
  dtSessao3: z.date().nullable().optional(),
  dtSessao4: z.date().nullable().optional(),
  dtSessao5: z.date().nullable().optional(),
  dtSessao6: z.date().nullable().optional(),
});

export type SessaoFormInputs = z.infer<typeof SessaoFormSchema>;
export type SessaoEditFormInputs = z.infer<typeof SessaoEditSchema>;
