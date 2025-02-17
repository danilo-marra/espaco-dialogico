import { z } from "zod";

export const TerapeutaFormSchema = z.object({
  nomeTerapeuta: z.string().min(1, "Nome do terapeuta é obrigatório"),
  telefoneTerapeuta: z.string().min(13, "Telefone é obrigatório"),
  emailTerapeuta: z.string().email("Email inválido"),
  enderecoTerapeuta: z.string(),
  dtEntradaTerapeuta: z.date({
    required_error: "Data é obrigatória",
  }),
  chavePixTerapeuta: z.string(),
});

export type TerapeutaFormInputs = z.infer<typeof TerapeutaFormSchema>;
export type TerapeutaFormInputsWithoutFoto = Omit<TerapeutaFormInputs, "foto">;
