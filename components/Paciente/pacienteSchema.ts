import { z } from "zod";

export const PacienteFormSchema = z.object({
  nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  dt_nascimento: z.date({
    required_error: "Data de nascimento é obrigatória",
    invalid_type_error: "Data inválida",
  }),
  terapeuta_id: z.string({
    required_error: "Terapeuta é obrigatório",
  }),
  nome_responsavel: z
    .string()
    .min(3, "O nome do responsável deve ter pelo menos 3 caracteres"),
  telefone_responsavel: z
    .string()
    .min(14, "Telefone inválido. Formato: (00) 00000-0000")
    .max(15, "Telefone inválido"),
  email_responsavel: z.string().email("E-mail inválido"),
  cpf_responsavel: z.string().min(11, "CPF inválido"),
  endereco_responsavel: z.string().min(5, "Endereço inválido"),
  origem: z.enum(["Indicação", "Instagram", "Busca no Google", "Outros"], {
    required_error: "Origem é obrigatória",
  }),
  dt_entrada: z.date({
    required_error: "Data de entrada é obrigatória",
    invalid_type_error: "Data inválida",
  }),
});

export type PacienteFormInputsWithoutFoto = z.infer<typeof PacienteFormSchema>;
