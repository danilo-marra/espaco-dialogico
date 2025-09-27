import useSWR from "swr";
import type { Paciente } from "tipos";
import axiosInstance from "utils/api";

const fetcher = async (url: string): Promise<Paciente[]> => {
  const response = await axiosInstance.get<Paciente[]>(url);
  return response.data;
};

export const useFetchPacientes = () => {
  const { data, error, isLoading, mutate } = useSWR<Paciente[]>(
    "/pacientes/",
    fetcher,
    {
      revalidateOnFocus: false, // Não revalidar quando a aba/janela ganhar foco
      revalidateIfStale: false, // Não revalidar dados antigos automaticamente
      dedupingInterval: 10000, // Deduplicar requisições similares em um intervalo de 10 segundos
    },
  );
  return {
    pacientes: data,
    isLoading,
    isError: error,
    mutate,
  };
};
