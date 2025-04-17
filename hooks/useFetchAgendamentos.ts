import useSWR from "swr";
import { Agendamento } from "tipos";
import axiosInstance from "utils/api";

const fetcher = async (url: string): Promise<Agendamento[]> => {
  const response = await axiosInstance.get<Agendamento[]>(url);
  return response.data;
};

export const useFetchAgendamentos = () => {
  const { data, error, isLoading, mutate } = useSWR<Agendamento[]>(
    "/agendamentos",
    fetcher,
    {
      revalidateOnFocus: false, // Não revalidar quando a aba/janela ganhar foco
      revalidateIfStale: false, // Não revalidar dados antigos automaticamente
      dedupingInterval: 10000, // Deduplicar requisições similares em um intervalo de 10 segundos
    },
  );

  // Função para atualizar um agendamento
  const updateAgendamento = async (id: string, agendamento: Agendamento) => {
    const response = await axiosInstance.put<Agendamento>(
      `/agendamentos/${id}`,
      agendamento,
    );
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
