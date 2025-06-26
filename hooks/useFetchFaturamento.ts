import useSWR from "swr";
import axiosInstance from "utils/api";

interface FaturamentoData {
  sessoes: Array<{
    id: string;
    data: string;
    horario: string;
    paciente: string;
    tipo: string;
    modalidade: string;
    valor: number;
    repasse: number;
    status: string;
    terapeuta: string;
    terapeuta_dt_entrada: string; // Adicionado campo
  }>;
  resumo: {
    totalSessoes: number;
    valorTotalSessoes: number;
    valorTotalRepasse: number;
  };
  periodo: string;
}

interface FiltrosFaturamento {
  periodo?: string;
  terapeutaId?: string;
  paciente?: string;
}

const fetcher = async (url: string): Promise<FaturamentoData> => {
  const response = await axiosInstance.get<FaturamentoData>(url);
  return response.data;
};

export function useFetchFaturamento(filtros: FiltrosFaturamento = {}) {
  const { periodo, terapeutaId, paciente } = filtros;

  // Construir a URL com os parâmetros de filtro
  const params = new URLSearchParams();
  if (periodo) params.append("periodo", periodo);
  if (terapeutaId && terapeutaId !== "Todos")
    params.append("terapeutaId", terapeutaId);
  if (paciente) params.append("paciente", paciente);

  const url = `/faturamento/${params.toString() ? `?${params.toString()}` : ""}`;

  const { data, error, isLoading, mutate } = useSWR<FaturamentoData>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
      dedupingInterval: 5000,
    },
  );

  return {
    faturamento: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
