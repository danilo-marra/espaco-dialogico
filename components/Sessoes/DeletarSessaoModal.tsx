import * as Dialog from "@radix-ui/react-dialog";
import { X } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "store/store";
import { deleteSessao } from "store/sessoesSlice";
import { Sessao } from "tipos";

interface DeletarSessaoModalProps {
  sessao: Sessao;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DeletarSessaoModal({
  sessao,
  open,
  onClose,
  onSuccess,
}: DeletarSessaoModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDeleteSessao() {
    try {
      setIsDeleting(true);
      await dispatch(deleteSessao(sessao.id)).unwrap();
      toast.success("Sessão excluída com sucesso");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Erro ao excluir sessão:", error);
      toast.error(typeof error === "string" ? error : "Erro ao excluir sessão");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-gray-500/25 fixed inset-0" />
        <Dialog.Content className="fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white p-[25px] shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none">
          <Dialog.Title className="text-xl font-medium text-azul mb-4">
            Excluir Sessão
          </Dialog.Title>
          <Dialog.Description className="mb-5 text-gray-600">
            Tem certeza que deseja excluir esta sessão? Esta ação não pode ser
            desfeita.
          </Dialog.Description>

          <div className="bg-gray-50 p-4 rounded-md mb-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Terapeuta</h4>
                <p className="text-gray-900">
                  {sessao.terapeutaInfo?.nome || "Não atribuído"}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Paciente</h4>
                <p className="text-gray-900">
                  {sessao.pacienteInfo?.nome || "Não atribuído"}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Tipo</h4>
                <p className="text-gray-900">{sessao.tipoSessao}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Valor</h4>
                <p className="text-gray-900">
                  R$ {sessao.valorSessao.toFixed(2).replace(".", ",")}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Status</h4>
                <p className="text-gray-900">{sessao.statusSessao}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              disabled={isDeleting}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDeleteSessao}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded"
              disabled={isDeleting}
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </button>
          </div>

          <Dialog.Close
            className="absolute top-[10px] right-[10px] h-[25px] w-[25px] appearance-none flex items-center justify-center rounded-full focus:shadow-[0_0_0_2px] focus:outline-none"
            aria-label="Close"
          >
            <X />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
