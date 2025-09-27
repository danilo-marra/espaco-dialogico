import useSWR from "swr";
import { useMemo } from "react";
import axiosInstance from "utils/api";
import { ResumoFinanceiro } from "../tipos";
import { useSWRConfig } from "swr";
import { useEffect } from "react";

// Fetcher otimizado que retorna dados e headers de performance
const fetcher = async (url: string) => {
  const response = await axiosInstance.get(url, {
    timeout: 10000, // 10 segundos timeout
  });
  return {
    data: response.data,
    responseTime: response.headers["x-response-time"],
    dataSource: response.headers["x-data-source"],
  };
};

// Cache para dados placeholder/fallback
const placeholderData: ResumoFinanceiro = {
  periodo: new Date().toISOString().slice(0, 7),
  receitaSessoes: 0,
  repasseTerapeutas: 0,
  entradasManuais: 0,
  saidasManuais: 0,
  totalEntradas: 0,
  totalSaidas: 0,
  saldoFinal: 0,
  quantidadeSessoes: 0,
};

// Hook otimizado para dados financeiros do dashboard
export function useOptimizedDashboardFinanceiro(periodo?: string) {
  const { mutate } = useSWRConfig();

  const url = periodo
    ? `/dashboard/financeiro-otimizado/?periodo=${periodo}`
    : `/dashboard/financeiro-otimizado/`;

  const { data, error, isLoading, isValidating } = useSWR<{
    data: ResumoFinanceiro | any;
    responseTime?: string;
    dataSource?: string;
  }>(url, fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
    refreshInterval: 300000, // 5 minutos
    dedupingInterval: 60000,
  });

  // Efeito para pré-carregar dados dos meses adjacentes
  useEffect(() => {
    if (periodo) {
      const [ano, mes] = periodo.split("-").map(Number);
      const dataBase = new Date(ano, mes - 1, 1);

      // Mês anterior
      const mesAnterior = new Date(dataBase);
      mesAnterior.setMonth(mesAnterior.getMonth() - 1);
      const periodoAnterior = `${mesAnterior.getFullYear()}-${String(
        mesAnterior.getMonth() + 1,
      ).padStart(2, "0")}`;
      mutate(`/dashboard/financeiro-otimizado/?periodo=${periodoAnterior}`);

      // Mês seguinte
      const mesSeguinte = new Date(dataBase);
      mesSeguinte.setMonth(mesSeguinte.getMonth() + 1);
      const periodoSeguinte = `${mesSeguinte.getFullYear()}-${String(
        mesSeguinte.getMonth() + 1,
      ).padStart(2, "0")}`;
      mutate(`/dashboard/financeiro-otimizado/?periodo=${periodoSeguinte}`);
    }
  }, [periodo, mutate]);

  const memoizedData = useMemo(() => {
    const responseData = data?.data;
    if (!responseData) {
      return {
        resumo: placeholderData,
        historico: [],
        isPlaceholder: true,
      };
    }

    const resumoRaw = responseData.resumo || responseData;

    // Garantir que todos os valores numéricos sejam válidos
    const resumo = {
      periodo: resumoRaw?.periodo || placeholderData.periodo,
      receitaSessoes: Number(resumoRaw?.receitaSessoes) || 0,
      repasseTerapeutas: Number(resumoRaw?.repasseTerapeutas) || 0,
      entradasManuais: Number(resumoRaw?.entradasManuais) || 0,
      saidasManuais: Number(resumoRaw?.saidasManuais) || 0,
      totalEntradas: Number(resumoRaw?.totalEntradas) || 0,
      totalSaidas: Number(resumoRaw?.totalSaidas) || 0,
      saldoFinal: Number(resumoRaw?.saldoFinal) || 0,
      quantidadeSessoes: Number(resumoRaw?.quantidadeSessoes) || 0,
    };

    return {
      resumo,
      historico: responseData.historico || [],
      isPlaceholder: false,
      responseTime: data?.responseTime,
      dataSource: data?.dataSource,
    };
  }, [data]);

  return {
    data: memoizedData,
    isLoading,
    error,
    mutate: () => mutate(url),
    isValidating,
  };
}

// Fetcher específico para histórico que retorna array
const historicoFetcher = async (url: string) => {
  const response = await axiosInstance.get(url, {
    timeout: 10000,
  });
  return response.data;
};

// Hook otimizado para histórico financeiro
export function useOptimizedDashboardFinanceiroHistorico() {
  const { data, error, isLoading, mutate, isValidating } = useSWR<
    Array<{
      mes: string;
      faturamento: number;
      despesas: number;
      lucro: number;
      totalEntradas: number;
      totalSaidas: number;
      saldoFinal: number;
    }>
  >(`/dashboard/financeiro-otimizado/?historico=true`, historicoFetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    revalidateOnMount: true,
    dedupingInterval: 300000, // 5 minutos - histórico muda muito pouco
    keepPreviousData: true,
    refreshInterval: 600000, // 10 minutos
    errorRetryCount: 3,
    errorRetryInterval: 3000,
    loadingTimeout: 12000, // Timeout maior para histórico
    refreshWhenHidden: false,
    refreshWhenOffline: false,

    // Comparação otimizada para arrays
    compare: (a, b) => {
      if (!a && !b) return true;
      if (!a || !b) return false;
      if (!Array.isArray(a) || !Array.isArray(b)) return false;
      if (a.length !== b.length) return false;

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

    shouldRetryOnError: (error) => {
      return (
        !!(error as any)?.response?.status &&
        (error as any).response.status >= 500
      );
    },
  });

  // Processar dados do histórico
  const processedHistorico = useMemo(() => {
    if (!data) return [];

    // Se recebemos um array vazio do backend, significa que realmente não há dados
    if (Array.isArray(data) && data.length === 0) {
      return [];
    }

    return data.map((item) => ({
      ...item,
      faturamento: Number(item.faturamento) || 0,
      despesas: Number(item.despesas) || 0,
      lucro: Number(item.lucro) || 0,
      totalEntradas: Number(item.totalEntradas) || 0,
      totalSaidas: Number(item.totalSaidas) || 0,
      saldoFinal: Number(item.saldoFinal) || 0,
    }));
  }, [data]);

  return {
    historicoFinanceiro: processedHistorico,
    isLoading: isLoading && !data,
    isValidating,
    isError: !!error,
    error,
    mutate,
    hasData: !!data && data.length > 0,
    isPlaceholder: !data || data.length === 0,
    isEmpty: !data || data.length === 0, // Indicador explícito de dados vazios
  };
}

// Hook para pré-carregamento de dados financeiros
export function usePreloadFinanceiro() {
  const agora = new Date();
  const periodos = Array.from({ length: 3 }, (_, i) => {
    const data = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
  });

  // Pré-carregar os últimos 3 meses usando múltiplas chamadas SWR
  const preload1 = useSWR(
    `/dashboard/financeiro-otimizado/?periodo=${periodos[0]}`,
    fetcher, // Usando fetcher original, não historicoFetcher
    {
      revalidateOnFocus: false,
      revalidateOnMount: false,
      dedupingInterval: 300000,
      refreshInterval: 0,
    },
  );

  const preload2 = useSWR(
    `/dashboard/financeiro-otimizado/?periodo=${periodos[1]}`,
    fetcher, // Usando fetcher original, não historicoFetcher
    {
      revalidateOnFocus: false,
      revalidateOnMount: false,
      dedupingInterval: 300000,
      refreshInterval: 0,
    },
  );

  const preload3 = useSWR(
    `/dashboard/financeiro-otimizado/?periodo=${periodos[2]}`,
    fetcher, // Usando fetcher original, não historicoFetcher
    {
      revalidateOnFocus: false,
      revalidateOnMount: false,
      dedupingInterval: 300000,
      refreshInterval: 0,
    },
  );

  return {
    preloadedPeriodos: [
      { periodo: periodos[0], data: preload1.data },
      { periodo: periodos[1], data: preload2.data },
      { periodo: periodos[2], data: preload3.data },
    ],
    isPreloading:
      preload1.isLoading || preload2.isLoading || preload3.isLoading,
  };
}

// Hook para sincronização entre abas (exemplo)
export function useFinanceiroSync() {
  const { mutate } = useSWRConfig();

  const invalidateFinanceiro = (periodo: string) => {
    // Invalida o cache para forçar um refresh em outras abas/componentes
    mutate(`/dashboard/financeiro-otimizado/?periodo=${periodo}`);
  };

  return { invalidateFinanceiro };
}
