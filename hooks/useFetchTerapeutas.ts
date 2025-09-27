import useSWR from "swr";
import type { Terapeuta } from "tipos";
import axiosInstance from "utils/api";

const fetcher = async (url: string): Promise<Terapeuta[]> => {
  const response = await axiosInstance.get<Terapeuta[]>(url);
  return response.data;
};

export const useFetchTerapeutas = () => {
  const { data, error, isLoading, mutate } = useSWR<Terapeuta[]>(
    "/terapeutas/",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true, // Permitir revalidação quando dados ficarem antigos
      revalidateOnMount: true, // Revalidar na montagem do componente
      dedupingInterval: 30000, // 30 segundos - terapeutas mudam pouco
      refreshInterval: 300000, // 5 minutos - refresh automático
      keepPreviousData: true, // Manter dados anteriores durante carregamento
      errorRetryCount: 3,
      errorRetryInterval: 2000,
      // Comparação personalizada para evitar re-renders desnecessários
      compare: (a, b) => {
        if (!a && !b) return true;
        if (!a || !b) return false;
        if (a.length !== b.length) return false;
        return a.every(
          (item, index) =>
            item.id === b[index]?.id &&
            item.updated_at === b[index]?.updated_at,
        );
      },
    },
  );
  return {
    terapeutas: data,
    isLoading,
    isError: error,
    mutate,
  };
};
