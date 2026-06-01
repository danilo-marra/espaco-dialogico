import useSWR from "swr";
import type { Sessao } from "tipos";
import axiosInstance from "utils/api";

type SessaoFilters = {
  terapeuta_id?: string;
  paciente_id?: string;
  tipo_sessao?: string;
  pagamento_realizado?: boolean;
  nota_fiscal?: string;
  repasse_realizado?: boolean;
  dataInicio?: string;
  dataFim?: string;
  agendamento_id?: string;
  limit?: number;
  offset?: number;
  refreshInterval?: number;
};

const fetcher = async (url: string): Promise<Sessao[]> => {
  const response = await axiosInstance.get<Sessao[]>(url);
  return response.data;
};

function buildSessoesKey(filters: SessaoFilters = {}) {
  const params = new URLSearchParams();

  params.set("limit", String(filters.limit ?? 500));
  params.set("offset", String(filters.offset ?? 0));

  if (filters.terapeuta_id) params.set("terapeuta_id", filters.terapeuta_id);
  if (filters.paciente_id) params.set("paciente_id", filters.paciente_id);
  if (filters.tipo_sessao) params.set("tipo_sessao", filters.tipo_sessao);
  if (filters.pagamento_realizado !== undefined) {
    params.set("pagamento_realizado", String(filters.pagamento_realizado));
  }
  if (filters.nota_fiscal) params.set("nota_fiscal", filters.nota_fiscal);
  if (filters.repasse_realizado !== undefined) {
    params.set("repasse_realizado", String(filters.repasse_realizado));
  }
  if (filters.dataInicio) params.set("dataInicio", filters.dataInicio);
  if (filters.dataFim) params.set("dataFim", filters.dataFim);
  if (filters.agendamento_id)
    params.set("agendamento_id", filters.agendamento_id);

  return `/sessoes/?${params.toString()}`;
}

export const useFetchSessoes = (filters: SessaoFilters = {}) => {
  const { data, error, isLoading, mutate } = useSWR<Sessao[]>(
    buildSessoesKey(filters),
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
