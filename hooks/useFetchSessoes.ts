import useSWR from "swr";
import type { Sessao } from "tipos";
import axiosInstance from "utils/api";

const fetcher = async (url: string): Promise<Sessao[]> => {
  const response = await axiosInstance.get<Sessao[]>(url);
  return response.data;
};

export const useFetchSessoes = () => {
  const { data, error, isLoading, mutate } = useSWR<Sessao[]>(
    "/sessoes/",
    fetcher,
    {
      revalidateOnFocus: true, // Revalidar quando o usuário voltar à aba
      revalidateIfStale: true, // Revalidar dados antigos automaticamente
      revalidateOnReconnect: true, // Revalidar quando a conexão for restabelecida
      dedupingInterval: 1000, // Reduzido para 1 segundo para melhor responsividade
      refreshInterval: 0, // Não atualizar automaticamente por tempo
      errorRetryInterval: 5000, // Tentar novamente após erro em 5 segundos
      focusThrottleInterval: 1000, // Limitar revalidação por foco a 1 segundo
    },
  );
  return {
    sessoes: data,
    isLoading,
    isError: error,
    mutate,
  };
};
