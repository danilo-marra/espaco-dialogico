import { z } from "zod";

export const TerapeutaFormSchema = z.object({
  nome: z
    .string()
    .min(1, "Nome do terapeuta é obrigatório")
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome não pode ter mais de 100 caracteres"),
  telefone: z
    .string()
    .min(1, "Telefone é obrigatório")
    .min(13, "Telefone deve estar no formato (00) 00000-0000")
    .max(15, "Telefone inválido"),
  email: z
    .string()
    .min(1, "Email é obrigatório")
    .email("Email deve ter um formato válido")
    .max(100, "Email não pode ter mais de 100 caracteres"),
  endereco: z
    .string()
    .max(200, "Endereço não pode ter mais de 200 caracteres")
    .optional(),
  dt_entrada: z
    .date({
      required_error: "Data de entrada é obrigatória",
      invalid_type_error: "Data de entrada deve ser uma data válida",
    })
    .refine(
      (date) => date <= new Date(),
      "Data de entrada não pode ser futura",
    ),
  chave_pix: z
    .string()
    .max(100, "Chave PIX não pode ter mais de 100 caracteres")
    .optional(),
});

export type TerapeutaFormInputs = z.infer<typeof TerapeutaFormSchema>;
export type TerapeutaFormInputsWithoutFoto = Omit<TerapeutaFormInputs, "foto">;
