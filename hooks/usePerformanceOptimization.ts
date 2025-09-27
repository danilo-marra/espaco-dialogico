/**
 * Hook para monitoramento e otimização de performance em tempo real
 * Integra com as APIs de performance do browser
 */

import { useEffect, useCallback, useRef, useState } from "react";
import { useSWRConfig } from "swr";

interface PerformanceMetrics {
  renderTime: number;
  apiResponseTimes: Record<string, number>;
  cacheHitRate: number;
  errorRate: number;
  memoryUsage?: number;
}

interface ApiPerformanceEntry {
  url: string;
  method: string;
  responseTime: number;
  timestamp: number;
  status: "success" | "error";
}

export function usePerformanceOptimization() {
  const { cache } = useSWRConfig();
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    apiResponseTimes: {},
    cacheHitRate: 0,
    errorRate: 0,
  });

  const renderStartTime = useRef<number>(performance.now());
  const apiCallsRef = useRef<ApiPerformanceEntry[]>([]);
  const componentMountTime = useRef<number>(Date.now());

  // Medir tempo de render do componente
  const measureRenderPerformance = useCallback(() => {
    const renderTime = performance.now() - renderStartTime.current;

    setMetrics((prev) => ({
      ...prev,
      renderTime: Math.round(renderTime * 100) / 100, // 2 casas decimais
    }));

    if (process.env.NODE_ENV === "development" && renderTime > 16) {
      console.warn(
        `⚠️ Render lento detectado: ${renderTime.toFixed(2)}ms (ideal: <16ms)`,
      );
    }

    return renderTime;
  }, []);

  // Registrar performance de APIs
  const logApiPerformance = useCallback(
    (
      url: string,
      method: string,
      responseTime: number,
      status: "success" | "error",
    ) => {
      const entry: ApiPerformanceEntry = {
        url,
        method,
        responseTime,
        timestamp: Date.now(),
        status,
      };

      apiCallsRef.current.push(entry);

      // Manter apenas as últimas 50 chamadas
      if (apiCallsRef.current.length > 50) {
        apiCallsRef.current = apiCallsRef.current.slice(-50);
      }

      // Atualizar métricas
      const recentCalls = apiCallsRef.current.filter(
        (call) => call.timestamp > Date.now() - 300000, // Últimos 5 minutos
      );

      const errorCalls = recentCalls.filter((call) => call.status === "error");

      const avgResponseTimes = recentCalls.reduce(
        (acc, call) => {
          if (!acc[call.url]) {
            acc[call.url] = [];
          }
          acc[call.url].push(call.responseTime);
          return acc;
        },
        {} as Record<string, number[]>,
      );

      const responseTimeAverages = Object.entries(avgResponseTimes).reduce(
        (acc, [url, times]) => {
          acc[url] =
            Math.round(
              (times.reduce((sum, time) => sum + time, 0) / times.length) * 100,
            ) / 100;
          return acc;
        },
        {} as Record<string, number>,
      );

      setMetrics((prev) => ({
        ...prev,
        apiResponseTimes: responseTimeAverages,
        errorRate:
          recentCalls.length > 0
            ? Math.round((errorCalls.length / recentCalls.length) * 10000) / 100
            : 0,
      }));

      // Alertas para APIs lentas
      if (process.env.NODE_ENV === "development") {
        if (responseTime > 1000) {
          console.warn(`🐌 API lenta: ${method} ${url} - ${responseTime}ms`);
        }
        if (responseTime > 3000) {
          console.error(
            `🔴 API muito lenta: ${method} ${url} - ${responseTime}ms`,
          );
        }
      }
    },
    [],
  );

  // Calcular cache hit rate
  const calculateCacheMetrics = useCallback(() => {
    const cacheKeys = Array.from(cache.keys());
    let hits = 0;
    let total = cacheKeys.length;

    cacheKeys.forEach((key) => {
      const entry = cache.get(key);
      if (entry && entry.data && !entry.error) {
        hits++;
      }
    });

    const hitRate = total > 0 ? Math.round((hits / total) * 10000) / 100 : 0;

    setMetrics((prev) => ({
      ...prev,
      cacheHitRate: hitRate,
    }));

    return hitRate;
  }, [cache]);

  // Monitorar uso de memória (se disponível)
  const measureMemoryUsage = useCallback(() => {
    if ("memory" in performance) {
      const memInfo = (performance as any).memory;
      const memoryUsage =
        Math.round((memInfo.usedJSHeapSize / 1024 / 1024) * 100) / 100; // MB

      setMetrics((prev) => ({
        ...prev,
        memoryUsage,
      }));

      if (memoryUsage > 100) {
        console.warn(`🧠 Alto uso de memória: ${memoryUsage}MB`);
      }

      return memoryUsage;
    }
    return undefined;
  }, []);

  // Gerar relatório de performance
  const generatePerformanceReport = useCallback(() => {
    const sessionDuration = (Date.now() - componentMountTime.current) / 1000; // segundos
    const recentCalls = apiCallsRef.current.filter(
      (call) => call.timestamp > Date.now() - 300000, // Últimos 5 minutos
    );

    const report = {
      sessionInfo: {
        duration: `${Math.round(sessionDuration)}s`,
        startTime: new Date(componentMountTime.current).toISOString(),
        userAgent: navigator.userAgent,
      },
      performance: {
        ...metrics,
        avgRenderTime: metrics.renderTime,
      },
      apiStats: {
        totalCalls: apiCallsRef.current.length,
        recentCalls: recentCalls.length,
        successRate: `${(100 - metrics.errorRate).toFixed(1)}%`,
        slowestEndpoint: Object.entries(metrics.apiResponseTimes).sort(
          ([, a], [, b]) => b - a,
        )[0] || ["N/A", 0],
        fastestEndpoint: Object.entries(metrics.apiResponseTimes).sort(
          ([, a], [, b]) => a - b,
        )[0] || ["N/A", 0],
      },
      recommendations: [],
    };

    // Gerar recomendações
    const recommendations: string[] = [];

    if (metrics.renderTime > 16) {
      recommendations.push(
        "Otimizar renders - tempo acima de 16ms pode causar jank",
      );
    }
    if (metrics.cacheHitRate < 80) {
      recommendations.push("Melhorar estratégia de cache - hit rate baixo");
    }
    if (metrics.errorRate > 5) {
      recommendations.push("Investigar erros de API - taxa de erro alta");
    }
    if (metrics.memoryUsage && metrics.memoryUsage > 100) {
      recommendations.push("Otimizar uso de memória - consumo alto detectado");
    }

    const slowApis = Object.entries(metrics.apiResponseTimes).filter(
      ([, time]) => time > 1000,
    );
    if (slowApis.length > 0) {
      recommendations.push(
        `Otimizar APIs lentas: ${slowApis.map(([url]) => url).join(", ")}`,
      );
    }

    report.recommendations = recommendations;

    return report;
  }, [metrics]);

  // Executar medições periódicas
  useEffect(() => {
    const interval = setInterval(() => {
      calculateCacheMetrics();
      measureMemoryUsage();
    }, 30000); // A cada 30 segundos

    return () => clearInterval(interval);
  }, [calculateCacheMetrics, measureMemoryUsage]);

  // Reset do timer de render a cada render
  useEffect(() => {
    renderStartTime.current = performance.now();
  });

  return {
    metrics,
    measureRenderPerformance,
    logApiPerformance,
    calculateCacheMetrics,
    measureMemoryUsage,
    generatePerformanceReport,

    // Utilitários para debug
    getRecentApiCalls: () => apiCallsRef.current.slice(-10),
    clearMetrics: () => {
      apiCallsRef.current = [];
      setMetrics({
        renderTime: 0,
        apiResponseTimes: {},
        cacheHitRate: 0,
        errorRate: 0,
      });
    },
  };
}

// Hook para detectar slow renders em desenvolvimento
export function useRenderProfiler(componentName: string) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current++;
    const currentTime = performance.now();
    const renderDuration = currentTime - lastRenderTime.current;
    lastRenderTime.current = currentTime;

    if (process.env.NODE_ENV === "development") {
      // Alertar sobre re-renders excessivos
      if (renderCount.current > 10) {
        console.warn(
          `🔄 ${componentName}: ${renderCount.current} renders detectados`,
        );
      }

      // Alertar sobre renders lentos
      if (renderDuration > 16) {
        console.warn(
          `⏱️ ${componentName}: render lento ${renderDuration.toFixed(2)}ms`,
        );
      }
    }
  });

  return {
    renderCount: renderCount.current,
    lastRenderDuration: performance.now() - lastRenderTime.current,
  };
}
