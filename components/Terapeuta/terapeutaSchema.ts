import { z } from "zod";

export const TerapeutaFormSchema = z.object({
  nome: z.string().min(1, "Nome do terapeuta é obrigatório"),
  telefone: z.string().min(13, "Telefone é obrigatório"),
  email: z.string().email("Email inválido"),
  endereco: z.string(),
  dt_entrada: z.date({
    required_error: "Data é obrigatória",
  }),
  chave_pix: z.string(),
});

export type TerapeutaFormInputs = z.infer<typeof TerapeutaFormSchema>;
export type TerapeutaFormInputsWithoutFoto = Omit<TerapeutaFormInputs, "foto">;
