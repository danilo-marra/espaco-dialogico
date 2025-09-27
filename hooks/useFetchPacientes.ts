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
      revalidateOnFocus: false,
      revalidateIfStale: true,
      revalidateOnMount: true,
      dedupingInterval: 25000, // 25 segundos - pacientes têm atualizações moderadas
      refreshInterval: 180000, // 3 minutos - dados de pacientes são mais dinâmicos
      keepPreviousData: true,
      errorRetryCount: 3,
      errorRetryInterval: 2000,
      // Comparação otimizada para pacientes
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
    pacientes: data,
    isLoading,
    isError: error,
    mutate,
  };
};
