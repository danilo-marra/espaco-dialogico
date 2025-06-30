import { z } from "zod";

// Schema de validação para agendamentos
export const agendamentoSchema = z
  .object({
    paciente_id: z.string({
      required_error: "Paciente é obrigatório",
    }),

    sessaoRealizada: z.boolean().optional(),

    terapeuta_id: z.string({
      required_error: "Terapeuta é obrigatório",
    }),

    dataAgendamento: z
      .date({
        required_error: "Data é obrigatória",
        invalid_type_error: "Data inválida",
      })
      .nullable(),

    horarioAgendamento: z
      .string({
        required_error: "Horário é obrigatório",
      })
      .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
        message: "Horário deve estar no formato HH:MM",
      }),

    localAgendamento: z.enum(
      ["Sala Verde", "Sala Azul", "Não Precisa de Sala"],
      {
        required_error: "Local é obrigatório",
        invalid_type_error: "Local inválido",
      },
    ),

    modalidadeAgendamento: z.enum(["Presencial", "Online"], {
      required_error: "Modalidade é obrigatória",
      invalid_type_error: "Modalidade inválida",
    }),

    tipoAgendamento: z.enum(
      [
        "Sessão",
        "Orientação Parental",
        "Visita Escolar",
        "Supervisão",
        "Outros",
      ],
      {
        required_error: "Tipo é obrigatório",
        invalid_type_error: "Tipo inválido",
      },
    ),

    valorAgendamento: z
      .number({
        required_error: "Valor é obrigatório",
        invalid_type_error: "Valor deve ser um número",
      })
      .min(0, {
        message: "Valor deve ser maior ou igual a zero",
      }),

    statusAgendamento: z.enum(["Confirmado", "Remarcado", "Cancelado"], {
      required_error: "Status é obrigatório",
      invalid_type_error: "Status inválido",
    }),

    observacoesAgendamento: z.string().optional(),

    // Campo opcional para ID de recorrência
    recurrenceId: z.string().uuid().optional(),

    // Novo campo para periodicidade
    periodicidade: z
      .enum(["Não repetir", "Semanal", "Quinzenal"])
      .default("Não repetir"),

    // Dias da semana (obrigatório se periodicidade for diferente de "Não repetir")
    diasDaSemana: z
      .array(
        z.enum([
          "Domingo",
          "Segunda-feira",
          "Terça-feira",
          "Quarta-feira",
          "Quinta-feira",
          "Sexta-feira",
          "Sábado",
        ]),
      )
      .optional(),

    // Data fim da recorrência (obrigatório se periodicidade for diferente de "Não repetir")
    dataFimRecorrencia: z.date().nullable().optional(),
  })
  .refine(
    (data) => {
      // Se periodicidade for diferente de "Não repetir", então diasDaSemana e dataFimRecorrencia são obrigatórios
      if (data.periodicidade !== "Não repetir") {
        return (
          data.diasDaSemana &&
          data.diasDaSemana.length > 0 &&
          data.dataFimRecorrencia !== null &&
          data.dataFimRecorrencia !== undefined
        );
      }
      return true;
    },
    {
      message:
        "Dias da semana e Data fim da recorrência são obrigatórios para agendamentos recorrentes",
      path: ["diasDaSemana"],
    },
  )
  .refine(
    (data) => {
      // Validar se o período da recorrência não é muito longo
      if (
        data.periodicidade !== "Não repetir" &&
        data.dataAgendamento &&
        data.dataFimRecorrencia
      ) {
        const dataInicio = new Date(data.dataAgendamento);
        const dataFim = new Date(data.dataFimRecorrencia);
        const diferencaDias = Math.ceil(
          (dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24),
        );

        return diferencaDias <= 365; // Máximo 1 ano
      }
      return true;
    },
    {
      message: "O período de recorrência não pode ser superior a 1 ano",
      path: ["dataFimRecorrencia"],
    },
  )
  .refine(
    (data) => {
      // Validar se a data fim não é anterior à data de início
      if (
        data.periodicidade !== "Não repetir" &&
        data.dataAgendamento &&
        data.dataFimRecorrencia
      ) {
        const dataInicio = new Date(data.dataAgendamento);
        const dataFim = new Date(data.dataFimRecorrencia);

        return dataFim > dataInicio;
      }
      return true;
    },
    {
      message: "A data fim deve ser posterior à data de início",
      path: ["dataFimRecorrencia"],
    },
  );
