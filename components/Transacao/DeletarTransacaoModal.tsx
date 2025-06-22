import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { X, Trash, Warning } from "@phosphor-icons/react";
import axiosInstance from "../../utils/api";
import { Transacao } from "../../store/transacoesSlice";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DeletarTransacaoModalProps {
  transacao: Transacao;
  onSuccess?: () => void;
  onClose: () => void;
}

export default function DeletarTransacaoModal({
  transacao,
  onSuccess,
  onClose,
}: DeletarTransacaoModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);

      await axiosInstance.delete(`/transacoes/${transacao.id}`);

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Erro ao deletar transação:", error);

      // Extrair mensagem de erro da resposta da API
      const errorMessage =
        error.response?.data?.error || error.message || "Erro inesperado";
      setError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="bg-gray-500/25 data-[state=open]:animate-overlayShow fixed inset-0" />
      <Dialog.Content className="data-[state=open]:animate-contentShow fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white p-[25px] shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none">
        <Dialog.Title className="sr-only">Deletar Transação</Dialog.Title>
        <Dialog.Description>
          <VisuallyHidden>Confirmar exclusão da transação</VisuallyHidden>
        </Dialog.Description>

        <div className="space-y-6 p-6 bg-white rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <Warning size={20} className="text-red-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 text-lg">
                Deletar Transação
              </h3>
              <p className="text-sm text-gray-500">
                Esta ação não pode ser desfeita.
              </p>
            </div>
          </div>

          {/* Detalhes da transação */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-gray-900 text-sm">
              Detalhes da transação:
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Tipo:</span>
                <span
                  className={`ml-2 font-medium ${
                    transacao.tipo === "entrada"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {transacao.tipo === "entrada" ? "Receita" : "Despesa"}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Data:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {format(new Date(transacao.data), "dd/MM/yyyy", {
                    locale: ptBR,
                  })}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Descrição:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {transacao.descricao}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Categoria:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {transacao.categoria}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Valor:</span>
                <span
                  className={`ml-2 font-medium ${
                    transacao.tipo === "entrada"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {transacao.tipo === "entrada" ? "+" : "-"}R${" "}
                  {Number(transacao.valor || 0)
                    .toFixed(2)
                    .replace(".", ",")}
                </span>
              </div>
            </div>
            {transacao.observacoes && (
              <div className="pt-2 border-t border-gray-200">
                <span className="text-gray-500 text-sm">Observações:</span>
                <p className="mt-1 text-sm text-gray-900">
                  {transacao.observacoes}
                </p>
              </div>
            )}
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">
              <strong>Atenção:</strong> Ao deletar esta transação, ela será
              removida permanentemente do sistema e não poderá ser recuperada.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <Warning size={20} className="text-red-500 flex-shrink-0" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              disabled={isDeleting}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Deletando...</span>
                </>
              ) : (
                <>
                  <Trash size={16} />
                  <span>Deletar</span>
                </>
              )}
            </button>
          </div>
        </div>

        <Dialog.Close
          className="text-rosa hover:bg-rosa/50 focus:shadow-azul absolute top-[10px] right-[10px] inline-flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-full focus:shadow-[0_0_0_2px] focus:outline-none"
          aria-label="Close"
          onClick={onClose}
        >
          <X />
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
