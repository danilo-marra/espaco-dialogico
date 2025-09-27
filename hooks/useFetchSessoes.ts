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
      revalidateOnFocus: false,
      revalidateIfStale: true,
      revalidateOnMount: true,
      dedupingInterval: 15000, // 15 segundos - sessões mudam frequentemente
      refreshInterval: 120000, // 2 minutos - dados mais dinâmicos
      keepPreviousData: true,
      errorRetryCount: 3,
      errorRetryInterval: 2000,
      // Comparação otimizada para sessões
      compare: (a, b) => {
        if (!a && !b) return true;
        if (!a || !b) return false;
        if (a.length !== b.length) return false;
        return a.every(
          (item, index) =>
            item.id === b[index]?.id &&
            item.updated_at === b[index]?.updated_at &&
            item.pagamentoRealizado === b[index]?.pagamentoRealizado,
        );
      },
    },
  );

  return {
    sessoes: data,
    isLoading,
    isError: error,
    mutate,
  };
};
