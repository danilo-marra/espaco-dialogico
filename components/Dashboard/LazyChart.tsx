import React, { Suspense, useState, useEffect } from "react";
import { ChartLoadingSkeleton } from "./DashboardSkeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../src/components/ui/card";
import { AlertCircle, RefreshCw } from "lucide-react";

// Componente de erro com retry
function ChartErrorFallback({
  _error,
  retry,
  title = "Gráfico",
}: {
  _error: Error;
  retry: () => void;
  title?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-red-600">
          <AlertCircle className="h-5 w-5 mr-2" />
          Erro ao carregar {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">
            Não foi possível carregar os dados do gráfico.
          </p>
          <button
            onClick={retry}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

// Hook para lazy loading com intersection observer
function useInView(options = {}) {
  const [ref, setRef] = useState<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: "50px",
        ...options,
      },
    );

    observer.observe(ref);

    return () => observer.disconnect();
  }, [ref, options]);

  return [setRef, inView] as const;
}

// Componente wrapper para gráficos com lazy loading
interface LazyChartProps {
  type: "bar" | "line" | "pie";
  data: any[];
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  eager?: boolean; // Carregar imediatamente sem lazy loading
}

export function LazyChart({
  type,
  data,
  title,
  description,
  children,
  className = "",
  eager = false,
}: LazyChartProps) {
  const [setRef, inView] = useInView();
  const [hasError, setHasError] = useState(false);

  // Carregar imediatamente se eager=true ou se já está em view
  const shouldLoad = eager || inView;

  const handleRetry = () => {
    setHasError(false);
  };

  // Componente de erro boundary para gráficos
  const ChartWithErrorBoundary = () => {
    try {
      return (
        <Suspense fallback={<ChartLoadingSkeleton type={type} />}>
          {children}
        </Suspense>
      );
    } catch (error) {
      console.error(`Erro no gráfico ${title}:`, error);
      setHasError(true);
      return (
        <ChartErrorFallback
          _error={error as Error}
          retry={handleRetry}
          title={title}
        />
      );
    }
  };

  if (hasError) {
    return (
      <ChartErrorFallback
        _error={new Error("Falha ao renderizar gráfico")}
        retry={handleRetry}
        title={title}
      />
    );
  }

  return (
    <div ref={setRef} className={className}>
      {shouldLoad && data?.length > 0 ? (
        <ChartWithErrorBoundary />
      ) : shouldLoad && (!data || data.length === 0) ? (
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            {description && (
              <p className="text-sm text-gray-600">{description}</p>
            )}
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <p>Nenhum dado disponível para exibir</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <ChartLoadingSkeleton type={type} />
      )}
    </div>
  );
}

// Hook para otimizar renderização de múltiplos gráficos
export function useChartOptimization() {
  const [visibleCharts, setVisibleCharts] = useState<Set<string>>(new Set());
  const [loadedCharts, setLoadedCharts] = useState<Set<string>>(new Set());

  const registerChart = (id: string, isVisible: boolean) => {
    if (isVisible && !visibleCharts.has(id)) {
      setVisibleCharts((prev) => new Set([...prev, id]));

      // Adicionar delay para evitar renderização simultânea
      setTimeout(() => {
        setLoadedCharts((prev) => new Set([...prev, id]));
      }, visibleCharts.size * 100); // 100ms de delay entre gráficos
    }
  };

  const shouldLoadChart = (id: string) => {
    return loadedCharts.has(id);
  };

  return {
    registerChart,
    shouldLoadChart,
    loadedCharts: Array.from(loadedCharts),
    visibleCharts: Array.from(visibleCharts),
  };
}

// Componente de placeholder para gráficos não carregados
export function ChartPlaceholder({
  title,
  description,
  height = "300px",
}: {
  title: string;
  description?: string;
  height?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <p className="text-sm text-gray-600">{description}</p>}
      </CardHeader>
      <CardContent>
        <div
          className="flex items-center justify-center bg-gray-50 rounded-md"
          style={{ height }}
        >
          <div className="text-center">
            <div className="animate-pulse">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <p className="text-gray-500">Carregando gráfico...</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
