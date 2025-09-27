import useSWR from "swr";
import { Agendamento } from "tipos";
import axiosInstance from "utils/api";

const fetcher = async (url: string): Promise<Agendamento[]> => {
  const response = await axiosInstance.get<Agendamento[]>(url);
  return response.data;
};

export const useFetchAgendamentos = () => {
  const { data, error, isLoading, mutate } = useSWR<Agendamento[]>(
    "/agendamentos/",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
      revalidateOnMount: true,
      dedupingInterval: 10000, // 10 segundos - agendamentos são muito dinâmicos
      refreshInterval: 60000, // 1 minuto - dados altamente dinâmicos
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
            item.statusAgendamento === b[index]?.statusAgendamento &&
            item.dataAgendamento === b[index]?.dataAgendamento,
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

    mutate(); // Revalidar os dados após a atualização
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
