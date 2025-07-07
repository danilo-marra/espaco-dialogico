import useSWR from "swr";
import axiosInstance from "utils/api";
import { ResumoFinanceiro } from "../tipos";

const fetcher = async (url: string) => {
  const response = await axiosInstance.get(url);
  return response.data;
};

export function useDashboardFinanceiro(periodo?: string) {
  const url = periodo
    ? `/dashboard/financeiro?periodo=${periodo}`
    : `/dashboard/financeiro`;

  const { data, error, isLoading, mutate, isValidating } =
    useSWR<ResumoFinanceiro>(url, fetcher, {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      revalidateOnMount: true,
      dedupingInterval: 20000, // 20 segundos para reduzir requests desnecessários
      keepPreviousData: true, // CRUCIAL: Mantém dados anteriores durante transições
      refreshInterval: 60000, // Atualização automática a cada 1 minuto
      errorRetryCount: 2, // Reduzir tentativas de retry
      errorRetryInterval: 1000, // Retry mais rápido
      // Configurações para transições mais suaves
      fallbackData: undefined, // Não usar fallback para evitar conflitos
      loadingTimeout: 2000, // Timeout menor para loading
      refreshWhenHidden: false, // Não atualizar quando a aba está escondida
      refreshWhenOffline: false, // Não atualizar quando offline
      // Otimização para transições suaves - comparação mais inteligente
      compare: (a, b) => {
        if (!a && !b) return true;
        if (!a || !b) return false;
        // Comparação específica para dados financeiros
        return (
          a.periodo === b.periodo &&
          a.totalEntradas === b.totalEntradas &&
          a.totalSaidas === b.totalSaidas &&
          a.saldoFinal === b.saldoFinal
        );
      },
    });

  return {
    resumoFinanceiro: data,
    isLoading,
    isValidating, // Adicionar isValidating para distinguir de isLoading
    isError: !!error,
    error,
    mutate,
  };
}

export function useDashboardFinanceiroHistorico() {
  const { data, error, isLoading, mutate, isValidating } = useSWR<
    Array<
      ResumoFinanceiro & {
        mes: string;
        faturamento: number;
        despesas: number;
        lucro: number;
      }
    >
  >(`/dashboard/financeiro?historico=true`, fetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    revalidateOnMount: true,
    dedupingInterval: 120000, // 2 minutos - dados históricos mudam menos
    keepPreviousData: true, // Mantém dados anteriores durante transições
    refreshInterval: 300000, // Atualização automática a cada 5 minutos
    errorRetryCount: 2,
    errorRetryInterval: 1000,
    // Configurações para transições suaves
    fallbackData: undefined,
    loadingTimeout: 3000,
    refreshWhenHidden: false,
    refreshWhenOffline: false,
    // Otimização para transições suaves - comparação mais eficiente
    compare: (a, b) => {
      if (!a && !b) return true;
      if (!a || !b) return false;
      if (a.length !== b.length) return false;
      // Comparar apenas campos essenciais para melhor performance
      return a.every((itemA, index) => {
        const itemB = b[index];
        return (
          itemA.mes === itemB.mes &&
          itemA.faturamento === itemB.faturamento &&
          itemA.despesas === itemB.despesas &&
          itemA.lucro === itemB.lucro
        );
      });
    },
  });

  return {
    historicoFinanceiro: data,
    isLoading,
    isValidating,
    isError: !!error,
    error,
    mutate,
  };
}
