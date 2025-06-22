import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { X, Check, Warning } from "@phosphor-icons/react";
import { transacaoSchema, TransacaoFormData } from "./transacaoSchema";
import axiosInstance from "../../utils/api";

// Categorias sugeridas por tipo
const categoriasSugeridas = {
  entrada: [
    "Receitas Extras",
    "Vendas",
    "Consultoria",
    "Cursos",
    "Reembolsos",
    "Outras Receitas",
  ],
  saida: [
    "Despesas Operacionais",
    "Manutenção",
    "Material de Escritório",
    "Conta de Luz",
    "Conta de Água",
    "Internet",
    "Telefone",
    "Aluguel",
    "Impostos",
    "Outras Despesas",
  ],
} as const;

interface NovaTransacaoModalProps {
  onSuccess?: () => void;
  onClose: () => void;
}

export default function NovaTransacaoModal({
  onSuccess,
  onClose,
}: NovaTransacaoModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<TransacaoFormData>({
    resolver: zodResolver(transacaoSchema),
    defaultValues: {
      tipo: "entrada",
      data: format(new Date(), "yyyy-MM-dd"),
    },
  });

  const tipoSelecionado = watch("tipo");

  const handleClose = () => {
    reset();
    setSubmitError(null);
    onClose();
  };
  const handleCreateNewTransacao = async (data: TransacaoFormData) => {
    try {
      setSubmitError(null); // Converter o data do form para o formato esperado pela API
      const transacaoData = {
        tipo: data.tipo!,
        categoria: data.categoria!,
        descricao: data.descricao!,
        valor: data.valor!,
        data: data.data!,
        observacoes: data.observacoes,
      };

      await axiosInstance.post("/transacoes", transacaoData);

      reset();
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Erro ao criar transação:", error);
      setSubmitError(
        error instanceof Error ? error.message : "Erro inesperado",
      );
    }
  };

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="bg-gray-500/25 data-[state=open]:animate-overlayShow fixed inset-0" />
      <Dialog.Content className="data-[state=open]:animate-contentShow fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white p-[25px] shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none">
        <Dialog.Title className="sr-only">Nova Transação</Dialog.Title>
        <Dialog.Description>
          <VisuallyHidden>Cadastrar Nova Transação</VisuallyHidden>
        </Dialog.Description>

        <form
          onSubmit={handleSubmit(handleCreateNewTransacao)}
          className="space-y-6 p-6 bg-white rounded-lg"
        >
          <h3 className="font-medium text-azul text-xl mt-6">Nova Transação</h3>

          {/* Tipo */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Tipo da Transação *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="entrada"
                  {...register("tipo")}
                  className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                />
                <span className="ml-2 text-sm font-medium text-green-700">
                  Receita
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="saida"
                  {...register("tipo")}
                  className="h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"
                />
                <span className="ml-2 text-sm font-medium text-red-700">
                  Despesa
                </span>
              </label>
            </div>
            {errors.tipo && (
              <p className="text-red-500 text-sm">{errors.tipo.message}</p>
            )}
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <label
              htmlFor="categoria"
              className="block text-sm font-medium text-gray-700"
            >
              Categoria *
            </label>
            <select
              id="categoria"
              {...register("categoria")}
              className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
              disabled={isSubmitting}
            >
              <option value="">Selecione uma categoria</option>
              {categoriasSugeridas[tipoSelecionado]?.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {categoria}
                </option>
              ))}
            </select>
            {errors.categoria && (
              <p className="text-red-500 text-sm">{errors.categoria.message}</p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <label
              htmlFor="descricao"
              className="block text-sm font-medium text-gray-700"
            >
              Descrição *
            </label>
            <input
              type="text"
              id="descricao"
              {...register("descricao")}
              placeholder="Descreva a transação..."
              className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
              disabled={isSubmitting}
            />
            {errors.descricao && (
              <p className="text-red-500 text-sm">{errors.descricao.message}</p>
            )}
          </div>

          {/* Valor */}
          <div className="space-y-2">
            <label
              htmlFor="valor"
              className="block text-sm font-medium text-gray-700"
            >
              Valor (R$) *
            </label>
            <input
              type="number"
              id="valor"
              step="0.01"
              min="0"
              {...register("valor", { valueAsNumber: true })}
              placeholder="0,00"
              className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
              disabled={isSubmitting}
            />
            {errors.valor && (
              <p className="text-red-500 text-sm">{errors.valor.message}</p>
            )}
          </div>

          {/* Data */}
          <div className="space-y-2">
            <label
              htmlFor="data"
              className="block text-sm font-medium text-gray-700"
            >
              Data *
            </label>
            <input
              type="date"
              id="data"
              {...register("data")}
              className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
              disabled={isSubmitting}
            />
            {errors.data && (
              <p className="text-red-500 text-sm">{errors.data.message}</p>
            )}
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <label
              htmlFor="observacoes"
              className="block text-sm font-medium text-gray-700"
            >
              Observações
            </label>
            <textarea
              id="observacoes"
              rows={3}
              {...register("observacoes")}
              placeholder="Informações adicionais (opcional)..."
              className="shadow-rosa/50 focus:shadow-rosa block w-full rounded-md px-4 py-2 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
              disabled={isSubmitting}
            />
            {errors.observacoes && (
              <p className="text-red-500 text-sm">
                {errors.observacoes.message}
              </p>
            )}
          </div>

          {/* Error Message */}
          {submitError && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <Warning size={20} className="text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="mt-6 flex justify-end">
            <button
              className={`bg-azul text-branco hover:bg-azul/75 focus:shadow-azul inline-flex h-[35px] items-center justify-center rounded-[4px] px-[15px] font-medium leading-none focus:shadow-[0_0_0_2px] focus:outline-none ${
                isSubmitting ? "cursor-not-allowed opacity-50" : ""
              }`}
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Check size={16} className="mr-2" />
                  Salvar Transação
                </>
              )}
            </button>
          </div>
        </form>

        <Dialog.Close
          className="text-rosa hover:bg-rosa/50 focus:shadow-azul absolute top-[10px] right-[10px] inline-flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-full focus:shadow-[0_0_0_2px] focus:outline-none"
          aria-label="Close"
          onClick={handleClose}
        >
          <X />
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
