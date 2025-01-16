import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "store/store";
import { deleteTerapeuta } from "store/terapeutasSlice";
import type { Terapeuta } from "tipos";
import { toast } from "sonner";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface DeletarTerapeutaModalProps {
  terapeuta: Terapeuta;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DeletarTerapeutaModal({
  terapeuta,
  open,
  onClose,
  onSuccess,
}: DeletarTerapeutaModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await dispatch(deleteTerapeuta(terapeuta.id)).unwrap();
      toast.success(
        `Terapeuta ${terapeuta.nomeTerapeuta} excluído com sucesso.`,
      );
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error("Erro ao excluir terapeuta.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-gray-500/25 fixed inset-0" />
        <Dialog.Content className="fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-md bg-white p-6">
          <Dialog.Title className="text-xl font-medium mb-4">
            Confirmar Exclusão
          </Dialog.Title>
          <Dialog.Description>
            <VisuallyHidden>Editar dados do terapeuta</VisuallyHidden>
          </Dialog.Description>
          <p className="mb-6">
            Tem certeza que deseja excluir o terapeuta {terapeuta.nomeTerapeuta}
            ? Esta ação não pode ser desfeita.
          </p>

          <div className="flex justify-end gap-4">
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
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
