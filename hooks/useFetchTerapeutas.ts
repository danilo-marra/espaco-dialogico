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
      revalidateOnFocus: false, // Não revalidar quando a aba/janela ganhar foco
      revalidateIfStale: false, // Não revalidar dados antigos automaticamente
      dedupingInterval: 10000, // Deduplicar requisições similares em um intervalo de 10 segundos
    },
  );
  return {
    terapeutas: data,
    isLoading,
    isError: error,
    mutate,
  };
};
