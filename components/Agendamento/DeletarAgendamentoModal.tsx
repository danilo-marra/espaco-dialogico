import * as Dialog from "@radix-ui/react-dialog";
import { X } from "@phosphor-icons/react";
import { useState } from "react";
import { Agendamento } from "tipos";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDispatch } from "react-redux";
import { AppDispatch } from "store/store";
import { deleteAgendamento, fetchAgendamentos } from "store/agendamentosSlice";
import { toast } from "sonner";
import { Switch } from "@headlessui/react";

interface DeletarAgendamentoModalProps {
  agendamento: Agendamento;
  open: boolean;
  onClose: () => void;
  onSuccess?: (_isRecorrente: boolean) => void;
}

export function DeletarAgendamentoModal({
  agendamento,
  open,
  onClose,
  onSuccess,
}: DeletarAgendamentoModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletarRecorrencia, setDeletarRecorrencia] = useState(false);

  // Formatar a data para exibição
  const dataFormatada = format(
    new Date(agendamento.dataAgendamento),
    "dd 'de' MMMM 'de' yyyy",
    { locale: ptBR },
  );

  async function handleDeleteAgendamento() {
    try {
      setIsDeleting(true);

      // Se for um agendamento recorrente e o usuário escolheu deletar todos
      if (agendamento.recurrenceId && deletarRecorrencia) {
        await dispatch(
          deleteAgendamento({
            id: agendamento.id,
            deleteAllRecurrences: true,
            recurrenceId: agendamento.recurrenceId,
          }),
        ).unwrap();
      } else {
        // Deletar apenas o agendamento atual
        await dispatch(deleteAgendamento(agendamento.id)).unwrap();
      }

      // Recarregar dados após exclusão
      dispatch(fetchAgendamentos());

      // Notifica o componente pai do sucesso da operação
      onSuccess?.(!!agendamento.recurrenceId && deletarRecorrencia);

      onClose();
    } catch (error) {
      console.error("Erro ao excluir agendamento:", error);
      toast.error(
        typeof error === "string" ? error : "Erro ao excluir agendamento",
      );
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
            Excluir Agendamento
          </Dialog.Title>

          <Dialog.Close className="absolute right-6 top-6 bg-transparent text-gray-500 hover:text-gray-800">
            <X size={24} weight="bold" />
          </Dialog.Close>

          <div className="mt-4 mb-6">
            <p className="mb-4">
              Tem certeza que deseja excluir este agendamento?
            </p>

            <div className="bg-red-50 p-4 rounded-md border border-red-200 mb-4">
              <p className="text-red-800 font-medium">
                Esta ação não pode ser desfeita.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <h3 className="font-medium mb-2">Detalhes do agendamento:</h3>
              <p>
                <span className="font-medium">Paciente:</span>{" "}
                {agendamento.pacienteInfo?.nome || "N/A"}
              </p>
              <p>
                <span className="font-medium">Terapeuta:</span>{" "}
                {agendamento.terapeutaInfo?.nome || "N/A"}
              </p>
              <p>
                <span className="font-medium">Data:</span> {dataFormatada}
              </p>
              <p>
                <span className="font-medium">Horário:</span>{" "}
                {agendamento.horarioAgendamento}
              </p>
              <p>
                <span className="font-medium">Local:</span>{" "}
                {agendamento.localAgendamento}
              </p>
              <p>
                <span className="font-medium">Status:</span>{" "}
                {agendamento.statusAgendamento}
              </p>
            </div>
          </div>

          {/* Opção para excluir todos os agendamentos recorrentes */}
          {agendamento.recurrenceId && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md mb-6">
              <div className="flex items-center justify-between">
                <span className="font-medium text-amber-800">
                  Este é um agendamento recorrente
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    Excluir todas as recorrências
                  </span>
                  <Switch
                    checked={deletarRecorrencia}
                    onChange={setDeletarRecorrencia}
                    className={`${
                      deletarRecorrencia ? "bg-azul" : "bg-gray-300"
                    } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
                  >
                    <span
                      className={`${
                        deletarRecorrencia ? "translate-x-6" : "translate-x-1"
                      } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                    />
                  </Switch>
                </div>
              </div>
              <p className="text-sm text-amber-700 mt-2">
                {deletarRecorrencia
                  ? "Todos os agendamentos desta recorrência serão excluídos."
                  : "Apenas este agendamento específico será excluído."}
              </p>
            </div>
          )}

          <footer className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 px-5 py-3 rounded-md font-semibold hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
              disabled={isDeleting}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDeleteAgendamento}
              className="bg-red-500 px-5 py-3 rounded-md font-semibold text-white hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
              disabled={isDeleting}
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </button>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
