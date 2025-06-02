import useSWR from "swr";
import type { Sessao } from "tipos";
import axiosInstance from "utils/api";

const fetcher = async (url: string): Promise<Sessao[]> => {
  const response = await axiosInstance.get<Sessao[]>(url);
  return response.data;
};

export const useFetchSessoes = () => {
  const { data, error, isLoading, mutate } = useSWR<Sessao[]>(
    "/sessoes",
    fetcher,
    {
      revalidateOnFocus: true, // Revalidar quando o usuário voltar à aba
      revalidateIfStale: true, // Revalidar dados antigos automaticamente
      revalidateOnReconnect: true, // Revalidar quando a conexão for restabelecida
      dedupingInterval: 2000, // Tempo mínimo entre requisições (2 segundos)
    },
  );
  return {
    sessoes: data,
    isLoading,
    isError: error,
    mutate,
  };
};
