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
      revalidateOnFocus: false, // Não revalidar quando a aba/janela ganhar foco
      revalidateIfStale: false, // Não revalidar dados antigos automaticamente
      dedupingInterval: 10000, // Deduplicar requisições similares em um intervalo de 10 segundos
    },
  );
  return {
    sessoes: data,
    isLoading,
    isError: error,
    mutate,
  };
};
