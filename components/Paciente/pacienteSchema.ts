import { z } from "zod";

// Define o schema do formulário
export const PacienteFormSchema = z.object({
  nome: z.string().min(3, { message: "O nome é obrigatório" }),
  dt_nascimento: z
    .date({
      invalid_type_error: "Data de nascimento inválida",
    })
    .optional(),
  terapeuta_id: z.string().min(1, {
    message: "Terapeuta responsável é obrigatório",
  }),
  nome_responsavel: z
    .string()
    .min(3, { message: "O nome do responsável é obrigatório" }),
  telefone_responsavel: z.string().min(14, {
    message: "Telefone inválido - formato esperado: (00) 00000-0000",
  }),
  email_responsavel: z.string().email({
    message: "Formato de email inválido",
  }),
  cpf_responsavel: z.string().min(14, {
    message: "CPF inválido - formato esperado: 000.000.000-00",
  }),
  endereco_responsavel: z.string().min(5, {
    message: "O endereço do responsável é obrigatório",
  }),
  origem: z.string().optional(),
  dt_entrada: z.date({
    required_error: "A data de entrada é obrigatória",
    invalid_type_error: "Data de entrada inválida",
  }),
});

// Tipo para o formulário de entrada na tabela de pacientes, sem campos automáticos de ID ou timestamps
export type PacienteFormInputsWithoutFoto = z.infer<typeof PacienteFormSchema>;
