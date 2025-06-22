import { z } from "zod";

export const transacaoSchema = z.object({
  tipo: z.enum(["entrada", "saida"], {
    required_error: "Tipo é obrigatório",
    invalid_type_error: "Tipo deve ser 'entrada' ou 'saida'",
  }),
  categoria: z
    .string({
      required_error: "Categoria é obrigatória",
    })
    .min(1, "Categoria não pode estar vazia")
    .max(100, "Categoria deve ter no máximo 100 caracteres"),
  descricao: z
    .string({
      required_error: "Descrição é obrigatória",
    })
    .min(1, "Descrição não pode estar vazia")
    .max(500, "Descrição deve ter no máximo 500 caracteres"),
  valor: z
    .number({
      required_error: "Valor é obrigatório",
      invalid_type_error: "Valor deve ser um número",
    })
    .positive("Valor deve ser maior que zero")
    .max(999999999.99, "Valor muito alto"),
  data: z
    .string({
      required_error: "Data é obrigatória",
    })
    .min(1, "Data não pode estar vazia"),
  observacoes: z
    .string()
    .max(1000, "Observações devem ter no máximo 1000 caracteres")
    .optional(),
});

export type TransacaoFormData = z.infer<typeof transacaoSchema>;

// Categorias predefinidas para facilitar o uso
export const categoriasSugeridas = {
  entrada: [
    "Receitas Extras",
    "Outras Receitas",
    "Reembolsos",
    "Vendas",
    "Serviços Externos",
    "Consultoria",
    "Bonificações",
  ],
  saida: [
    "Despesas Operacionais",
    "Manutenção",
    "Despesas Administrativas",
    "Materiais",
    "Equipamentos",
    "Marketing",
    "Capacitação",
    "Impostos",
    "Seguros",
    "Aluguel",
    "Utilities",
  ],
};
