import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { X, Check, Warning } from "@phosphor-icons/react";
import { transacaoSchema, TransacaoFormData } from "./transacaoSchema";
import axiosInstance from "../../utils/api";
import { Transacao } from "../../store/transacoesSlice";
import { maskPrice } from "../../utils/formatter";
import { emitFinanceiroUpdate } from "../../hooks/useFinanceiroSync";

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

interface EditarTransacaoModalProps {
  transacao: Transacao;
  onSuccess?: () => void;
  onClose: () => void;
}

export default function EditarTransacaoModal({
  transacao,
  onSuccess,
  onClose,
}: EditarTransacaoModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { isSubmitting, errors },
  } = useForm<TransacaoFormData>({
    resolver: zodResolver(transacaoSchema),
    defaultValues: {
      tipo: transacao.tipo,
      categoria: transacao.categoria,
      descricao: transacao.descricao,
      valor: Number(transacao.valor),
      data: transacao.data
        ? format(new Date(transacao.data), "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd"),
      observacoes: transacao.observacoes || "",
    },
  });

  const tipoSelecionado = watch("tipo");

  // Atualizar valores quando a transação muda
  useEffect(() => {
    if (transacao) {
      setValue("tipo", transacao.tipo);
      setValue("categoria", transacao.categoria);
      setValue("descricao", transacao.descricao);
      setValue("valor", Number(transacao.valor));
      setValue(
        "data",
        transacao.data
          ? format(new Date(transacao.data), "yyyy-MM-dd")
          : format(new Date(), "yyyy-MM-dd"),
      );
      setValue("observacoes", transacao.observacoes || "");
    }
  }, [transacao, setValue]);

  const handleClose = () => {
    reset();
    setSubmitError(null);
    onClose();
  };

  const handleUpdateTransacao = async (data: TransacaoFormData) => {
    try {
      setSubmitError(null);

      // Converter o data do form para o formato esperado pela API
      const transacaoData = {
        tipo: data.tipo!,
        categoria: data.categoria!,
        descricao: data.descricao!,
        valor: data.valor!,
        data: data.data!,
        observacoes: data.observacoes,
      };

      await axiosInstance.put(`/transacoes/${transacao.id}`, transacaoData);

      // Emitir evento para atualização automática dos gráficos
      emitFinanceiroUpdate("updated");

      reset();
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Erro ao atualizar transação:", error);

      // Extrair mensagem de erro da resposta da API
      const errorMessage =
        error.response?.data?.error || error.message || "Erro inesperado";
      setSubmitError(errorMessage);
    }
  };

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="bg-gray-500/25 data-[state=open]:animate-overlayShow fixed inset-0 z-50" />
      <Dialog.Content className="data-[state=open]:animate-contentShow fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white p-[25px] shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none overflow-y-auto z-50">
        <Dialog.Title className="sr-only">Editar Transação</Dialog.Title>
        <Dialog.Description>
          <VisuallyHidden>Editar Transação Existente</VisuallyHidden>
        </Dialog.Description>

        <form
          onSubmit={handleSubmit(handleUpdateTransacao)}
          className="space-y-6 p-6 bg-white rounded-lg"
        >
          <h3 className="font-medium text-azul text-xl mt-6">
            Editar Transação
          </h3>

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
                  className="mr-2"
                  disabled={isSubmitting}
                />
                <span className="text-sm">Entrada (Receita)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="saida"
                  {...register("tipo")}
                  className="mr-2"
                  disabled={isSubmitting}
                />
                <span className="text-sm">Saída (Despesa)</span>
              </label>
            </div>
            {errors.tipo && (
              <span className="text-red-500 text-sm">
                {errors.tipo.message}
              </span>
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
              {categoriasSugeridas[
                tipoSelecionado as keyof typeof categoriasSugeridas
              ]?.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {categoria}
                </option>
              ))}
            </select>
            {errors.categoria && (
              <span className="text-red-500 text-sm">
                {errors.categoria.message}
              </span>
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
              <span className="text-red-500 text-sm">
                {errors.descricao.message}
              </span>
            )}
          </div>

          {/* Valor */}
          <div className="space-y-2">
            <label
              htmlFor="valor"
              className="block text-sm font-medium text-gray-700"
            >
              Valor *
            </label>
            <input
              type="text"
              id="valor"
              placeholder="R$ 0,00"
              className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
              disabled={isSubmitting}
              defaultValue={`R$ ${Number(transacao.valor).toFixed(2).replace(".", ",")}`}
              onChange={(e) => {
                const maskedValue = maskPrice(e.target.value);
                e.target.value = maskedValue;

                // Extrai o valor numérico e define no formulário
                const numericValue =
                  Number(maskedValue.replace(/[^\d]/g, "")) / 100;
                setValue("valor", numericValue);
              }}
            />
            {errors.valor && (
              <span className="text-red-500 text-sm">
                {errors.valor.message}
              </span>
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
              <span className="text-red-500 text-sm">
                {errors.data.message}
              </span>
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
              <span className="text-red-500 text-sm">
                {errors.observacoes.message}
              </span>
            )}
          </div>

          {/* Error Message */}
          {submitError && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <Warning size={20} className="text-red-500 flex-shrink-0" />
              <span className="text-red-700 text-sm">{submitError}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-azul border border-transparent rounded-md hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-azul disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Atualizando...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>Atualizar</span>
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
