import useSWR from "swr";
import type { Paciente } from "tipos";
import axiosInstance from "utils/api";

type PacienteFilters = {
  terapeuta_id?: string;
  search?: string;
  limit?: number;
  offset?: number;
  refreshInterval?: number;
};

const fetcher = async (url: string): Promise<Paciente[]> => {
  const response = await axiosInstance.get<Paciente[]>(url);
  return response.data;
};

function buildPacientesKey(filters: PacienteFilters = {}) {
  const params = new URLSearchParams();

  params.set("limit", String(filters.limit ?? 200));
  params.set("offset", String(filters.offset ?? 0));

  if (filters.terapeuta_id) params.set("terapeuta_id", filters.terapeuta_id);
  if (filters.search) params.set("search", filters.search);

  return `/pacientes/?${params.toString()}`;
}

export const useFetchPacientes = (filters: PacienteFilters = {}) => {
  const { data, error, isLoading, mutate } = useSWR<Paciente[]>(
    buildPacientesKey(filters),
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
      revalidateOnMount: true,
      dedupingInterval: 60000,
      refreshInterval: filters.refreshInterval ?? 0,
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
