import useSWR from "swr";
import { Transacao } from "../store/transacoesSlice";
import axiosInstance from "utils/api";

const fetcher = async (url: string): Promise<Transacao[]> => {
  const response = await axiosInstance.get<Transacao[]>(url);
  return response.data;
};

export function useFetchTransacoes() {
  const { data, error, isLoading, mutate } = useSWR<Transacao[]>(
    "/transacoes/",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
      revalidateOnMount: true,
      dedupingInterval: 20000, // 20 segundos - transações têm frequência média
      refreshInterval: 240000, // 4 minutos - dados moderadamente dinâmicos
      keepPreviousData: true,
      errorRetryCount: 3,
      errorRetryInterval: 2000,
      // Comparação otimizada para transações
      compare: (a, b) => {
        if (!a && !b) return true;
        if (!a || !b) return false;
        if (a.length !== b.length) return false;
        return a.every(
          (item, index) =>
            item.id === b[index]?.id &&
            item.valor === b[index]?.valor &&
            item.tipo === b[index]?.tipo,
        );
      },
    },
  );

  return {
    transacoes: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
