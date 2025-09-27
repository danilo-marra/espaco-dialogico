/**
 * Hook inteligente para gerenciamento de cache e preload de dados
 * Implementa estratégias de cache otimizadas para diferentes tipos de dados
 */

import { useEffect, useCallback, useRef } from "react";
import { useSWRConfig } from "swr";

interface CacheMetrics {
  hitCount: number;
  missCount: number;
  errorCount: number;
  lastUpdate: number;
}

interface SmartCacheOptions {
  enablePreload?: boolean;
  enableMetrics?: boolean;
  preloadDelay?: number;
  backgroundRefresh?: boolean;
}

export function useSmartCache(options: SmartCacheOptions = {}) {
  const {
    enablePreload = true,
    enableMetrics = true,
    preloadDelay = 1000,
    backgroundRefresh = true,
  } = options;

  const { mutate, cache } = useSWRConfig();

  // Métricas de cache
  const getMetrics = useCallback((): CacheMetrics => {
    const keys = Array.from(cache.keys());
    const metrics = {
      hitCount: keys.length,
      missCount: 0,
      errorCount: 0,
      lastUpdate: Date.now(),
    };

    // Análise simplificada de cache
    keys.forEach((key) => {
      const cacheEntry = cache.get(key);
      if (cacheEntry?.isValidating) {
        metrics.missCount++;
      }
      if (cacheEntry?.error) {
        metrics.errorCount++;
      }
    });

    return metrics;
  }, [cache]);

  // Invalidar cache específico por tipo
  const invalidateByType = useCallback(
    async (
      type:
        | "terapeutas"
        | "pacientes"
        | "agendamentos"
        | "sessoes"
        | "transacoes"
        | "dashboard",
    ) => {
      const patterns = {
        terapeutas: ["/terapeutas/"],
        pacientes: ["/pacientes/"],
        agendamentos: ["/agendamentos/"],
        sessoes: ["/sessoes/"],
        transacoes: ["/transacoes/"],
        dashboard: ["/dashboard/financeiro-otimizado/"],
      };

      const urls = patterns[type];
      await Promise.all(urls.map((url) => mutate(url)));
    },
    [mutate],
  );

  // Preload inteligente baseado em padrões de uso
  const preloadEssentialData = useCallback(async () => {
    if (!enablePreload) return;

    // Prioridade 1: Dados críticos para dashboard
    const criticalData = ["/terapeutas/", "/pacientes/", "/agendamentos/"];

    // Prioridade 2: Dados complementares
    const complementaryData = [
      "/sessoes/",
      "/transacoes/",
      "/dashboard/financeiro-otimizado/",
    ];

    try {
      // Preload dados críticos primeiro
      await Promise.all(
        criticalData.map((url) => mutate(url, undefined, { revalidate: true })),
      );

      // Aguardar um pouco antes de carregar dados complementares
      setTimeout(async () => {
        await Promise.all(
          complementaryData.map((url) =>
            mutate(url, undefined, { revalidate: true }),
          ),
        );
      }, preloadDelay);
    } catch (error) {
      console.warn("Erro durante preload:", error);
    }
  }, [enablePreload, preloadDelay, mutate]);

  // Cache warming para dados específicos do usuário
  const warmCache = useCallback(
    async (userType: "admin" | "terapeuta" | "secretaria") => {
      const cacheStrategies = {
        admin: [
          "/terapeutas/",
          "/pacientes/",
          "/agendamentos/",
          "/sessoes/",
          "/transacoes/",
          "/dashboard/financeiro-otimizado/",
        ],
        terapeuta: ["/pacientes/", "/agendamentos/", "/sessoes/"],
        secretaria: ["/agendamentos/", "/pacientes/", "/terapeutas/"],
      };

      const urls = cacheStrategies[userType];
      await Promise.all(
        urls.map((url) => mutate(url, undefined, { revalidate: true })),
      );
    },
    [mutate],
  );

  // Limpeza inteligente de cache antigo
  const cleanStaleCache = useCallback(() => {
    // Força revalidação de dados antigos através do SWR
    const staleUrls = [
      "/terapeutas/",
      "/pacientes/",
      "/agendamentos/",
      "/sessoes/",
      "/transacoes/",
    ];

    staleUrls.forEach((url) => {
      mutate(url, undefined, { revalidate: true });
    });
  }, [mutate]);

  // Background refresh para manter dados atualizados
  useEffect(() => {
    if (!backgroundRefresh) return;

    const interval = setInterval(
      () => {
        const currentHour = new Date().getHours();

        // Refresh mais frequente durante horário comercial (8-18h)
        const isBusinessHours = currentHour >= 8 && currentHour <= 18;

        if (isBusinessHours) {
          // Refresh dados dinâmicos durante horário comercial
          mutate("/agendamentos/", undefined, { revalidate: true });
          mutate("/sessoes/", undefined, { revalidate: true });
        }
      },
      5 * 60 * 1000,
    ); // 5 minutos

    return () => clearInterval(interval);
  }, [backgroundRefresh, mutate]);

  // Limpeza automática de cache
  useEffect(() => {
    const cleanup = setInterval(cleanStaleCache, 15 * 60 * 1000); // 15 minutos
    return () => clearInterval(cleanup);
  }, [cleanStaleCache]);

  return {
    // Métricas
    getMetrics: enableMetrics ? getMetrics : undefined,

    // Operações de cache
    invalidateByType,
    preloadEssentialData,
    warmCache,
    cleanStaleCache,

    // Estado do cache
    cacheSize: Array.from(cache.keys()).length,

    // Utilitários
    refreshAll: () => mutate(() => true),
    clearAll: () => {
      Array.from(cache.keys()).forEach((key) => cache.delete(key));
    },
  };
}

// Hook para monitoramento de performance em tempo real
export function usePerformanceMonitor() {
  const startTime = performance.now();

  const measureRenderTime = useCallback(() => {
    return performance.now() - startTime;
  }, [startTime]);

  const logPerformance = useCallback((operation: string, duration: number) => {
    if (process.env.NODE_ENV === "development") {
      console.log(
        `🚀 Performance: ${operation} completou em ${duration.toFixed(2)}ms`,
      );

      // Alertar sobre operações lentas
      if (duration > 1000) {
        console.warn(
          `⚠️  Operação lenta detectada: ${operation} (${duration.toFixed(2)}ms)`,
        );
      }
    }
  }, []);

  return {
    measureRenderTime,
    logPerformance,
    startTime,
  };
}

// Hook para otimização de re-renders
export function useRenderOptimization() {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current++;

    if (process.env.NODE_ENV === "development" && renderCount.current > 5) {
      console.warn(`🔄 Componente re-renderizado ${renderCount.current} vezes`);
    }
  });

  return {
    renderCount: renderCount.current,
  };
}
