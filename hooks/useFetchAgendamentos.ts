import useSWR from "swr";
import { Agendamento } from "tipos";
import axiosInstance from "utils/api";

type AgendamentoFilters = {
  terapeuta_id?: string;
  paciente_id?: string;
  status?: string;
  dataInicio?: string;
  dataFim?: string;
  limit?: number;
  offset?: number;
  refreshInterval?: number;
};

const fetcher = async (url: string): Promise<Agendamento[]> => {
  const response = await axiosInstance.get<Agendamento[]>(url);
  return response.data;
};

function buildAgendamentosKey(filters: AgendamentoFilters = {}) {
  const params = new URLSearchParams();

  params.set("limit", String(filters.limit ?? 500));
  params.set("offset", String(filters.offset ?? 0));

  if (filters.terapeuta_id) params.set("terapeuta_id", filters.terapeuta_id);
  if (filters.paciente_id) params.set("paciente_id", filters.paciente_id);
  if (filters.status) params.set("status", filters.status);
  if (filters.dataInicio) params.set("dataInicio", filters.dataInicio);
  if (filters.dataFim) params.set("dataFim", filters.dataFim);

  return `/agendamentos/?${params.toString()}`;
}

export const useFetchAgendamentos = (filters: AgendamentoFilters = {}) => {
  const { data, error, isLoading, mutate } = useSWR<Agendamento[]>(
    buildAgendamentosKey(filters),
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
      revalidateOnMount: true,
      dedupingInterval: 30000,
      refreshInterval: filters.refreshInterval ?? 0,
      keepPreviousData: true,
      errorRetryCount: 3,
      errorRetryInterval: 1500,
      // Comparação otimizada para agendamentos
      compare: (a, b) => {
        if (!a && !b) return true;
        if (!a || !b) return false;
        if (a.length !== b.length) return false;
        return a.every(
          (item, index) =>
            item.id === b[index]?.id &&
            item.updated_at === b[index]?.updated_at &&
            item.statusAgendamento === b[index]?.statusAgendamento &&
            item.dataAgendamento === b[index]?.dataAgendamento &&
            item.sessaoRealizada === b[index]?.sessaoRealizada &&
            item.falta === b[index]?.falta,
        );
      },
    },
  );

  // Função para atualizar um agendamento
  const updateAgendamento = async (id: string, agendamento: Agendamento) => {
    const response = await axiosInstance.put(
      `/agendamentos/${id}/`,
      agendamento,
    );

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    mutate((currentData) => {
      if (!currentData) return currentData;
      return currentData.map((item) =>
        item.id === response.data.id ? response.data : item,
      );
    }, false);
    return response.data;
  };

  return {
    agendamentos: data,
    isLoading,
    isError: error,
    mutate,
    updateAgendamento,
  };
};
