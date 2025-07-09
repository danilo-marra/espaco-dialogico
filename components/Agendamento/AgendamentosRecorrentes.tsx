import { useEffect, useState } from "react";
import { Agendamento } from "../../tipos";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { toast } from "react-toastify";
import { useCallback } from "react";

type AgendamentosRecorrentesProps = {
  recurrenceId: string;
  onClose: () => void;
  onRefresh?: () => void;
};

export function AgendamentosRecorrentes({
  recurrenceId,
  onClose,
}: AgendamentosRecorrentesProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [error, setError] = useState<string | null>(null);

  const carregarAgendamentosRecorrentes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/v1/agendamentos/recurrences/${recurrenceId}`,
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Erro ao carregar agendamentos recorrentes",
        );
      }

      const data = await response.json();
      setAgendamentos(data.data);
    } catch (error: any) {
      console.error("Erro ao carregar agendamentos recorrentes:", error);
      setError(
        error.message ||
          "Ocorreu um erro ao carregar os agendamentos recorrentes",
      );
      toast.error("Erro ao carregar agendamentos recorrentes");
    } finally {
      setIsLoading(false);
    }
  }, [recurrenceId]);

  useEffect(() => {
    if (recurrenceId) {
      carregarAgendamentosRecorrentes();
    }
  }, [recurrenceId, carregarAgendamentosRecorrentes]);

  // Função para formatar a data no estilo brasileiro
  function formatarData(data: Date | string) {
    if (!data) return "-";
    return format(new Date(data), "dd/MM/yyyy", { locale: ptBR });
  }

  // Função para determinar a classe CSS com base no status
  function getStatusClass(status: string) {
    switch (status) {
      case "Confirmado":
        return "bg-green-100 text-green-800";
      case "Cancelado":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-5xl w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-azul">
          Agendamentos Recorrentes
        </h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="spinner"></div>
          <p className="ml-2">Carregando agendamentos...</p>
        </div>
      ) : error ? (
        <div className="text-red-500 bg-red-50 p-4 rounded mb-4">
          <p>{error}</p>
        </div>
      ) : agendamentos.length === 0 ? (
        <div className="text-center py-8">
          <p>Nenhum agendamento recorrente encontrado.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-lg">
            <thead>
              <tr className="bg-gray-100 text-gray-700 text-left">
                <th className="py-3 px-4 border-b">Data</th>
                <th className="py-3 px-4 border-b">Horário</th>
                <th className="py-3 px-4 border-b">Paciente</th>
                <th className="py-3 px-4 border-b">Terapeuta</th>
                <th className="py-3 px-4 border-b">Local</th>
                <th className="py-3 px-4 border-b">Modalidade</th>
                <th className="py-3 px-4 border-b">Status</th>
              </tr>
            </thead>
            <tbody>
              {agendamentos.map((agendamento) => (
                <tr key={agendamento.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 border-b">
                    {formatarData(agendamento.dataAgendamento)}
                  </td>
                  <td className="py-3 px-4 border-b">
                    {agendamento.horarioAgendamento}
                  </td>
                  <td className="py-3 px-4 border-b">
                    {agendamento.pacienteInfo?.nome || "-"}
                  </td>
                  <td className="py-3 px-4 border-b">
                    {agendamento.terapeutaInfo?.nome || "-"}
                  </td>
                  <td className="py-3 px-4 border-b">
                    {agendamento.localAgendamento}
                  </td>
                  <td className="py-3 px-4 border-b">
                    {agendamento.modalidadeAgendamento}
                  </td>
                  <td className="py-3 px-4 border-b">
                    <span
                      className={`inline-block rounded px-2 py-1 text-xs font-semibold ${getStatusClass(
                        agendamento.statusAgendamento,
                      )}`}
                    >
                      {agendamento.statusAgendamento}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-end mt-6 gap-4">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
