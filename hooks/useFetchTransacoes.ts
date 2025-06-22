import useSWR from "swr";
import { Transacao } from "../store/transacoesSlice";
import axiosInstance from "utils/api";

const fetcher = async (url: string): Promise<Transacao[]> => {
  const response = await axiosInstance.get<Transacao[]>(url);
  return response.data;
};

export function useFetchTransacoes() {
  const { data, error, isLoading, mutate } = useSWR<Transacao[]>(
    "/transacoes",
    fetcher,
    {
      revalidateOnFocus: false, // Não revalidar quando a aba/janela ganhar foco
      revalidateIfStale: true, // Permitir revalidação de dados antigos
      dedupingInterval: 5000, // Reduzir o intervalo de deduplicação
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
