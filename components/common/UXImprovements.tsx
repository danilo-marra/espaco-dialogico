import React, { Suspense, ReactNode } from "react";
import ErrorBoundary, {
  APIErrorBoundary,
  ChartErrorBoundary,
  DashboardErrorBoundary,
  FormErrorBoundary,
} from "./ErrorBoundary";
import {
  LoadingState,
  SectionLoadingOverlay,
  TerapeutasLoading,
  PacientesLoading,
  SessoesLoading,
  AgendamentosLoading,
  FinanceiroLoading,
  ChartLoading,
} from "./LoadingStates";
import {
  Skeleton,
  CardSkeleton,
  TableSkeleton,
  ListSkeleton,
  FormSkeleton,
  ChartSkeleton,
  FullDashboardSkeleton,
  StatsSkeleton,
} from "./SkeletonLoading";

// Props base para componentes com UX melhorado
interface WithUXProps {
  children: ReactNode;
  loading?: boolean;
  error?: boolean | Error;
  fallback?: ReactNode;
  skeleton?: ReactNode;
  className?: string;
}

// Wrapper principal que combina Error Boundary + Loading States + Skeleton
export function UXWrapper({
  children,
  loading = false,
  error = false,
  fallback,
  skeleton,
  className = "",
}: WithUXProps) {
  if (error) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <ErrorBoundary>{children}</ErrorBoundary>;
  }

  if (loading) {
    if (skeleton) {
      return <>{skeleton}</>;
    }
    return <LoadingState />;
  }

  return (
    <ErrorBoundary>
      <div className={className}>{children}</div>
    </ErrorBoundary>
  );
}

// Componentes específicos para diferentes seções

// Dashboard com UX completo
export function DashboardUXWrapper({
  children,
  loading = false,
  className = "",
}: {
  children: ReactNode;
  loading?: boolean;
  className?: string;
}) {
  return (
    <DashboardErrorBoundary>
      <div className={`relative ${className}`}>
        {loading && (
          <SectionLoadingOverlay type="api" message="Carregando dashboard..." />
        )}
        <Suspense fallback={<FullDashboardSkeleton />}>{children}</Suspense>
      </div>
    </DashboardErrorBoundary>
  );
}

// Gráficos com UX completo
export function ChartUXWrapper({
  children,
  loading = false,
  chartType = "bar",
  className = "",
}: {
  children: ReactNode;
  loading?: boolean;
  chartType?: "bar" | "line" | "pie" | "area";
  className?: string;
}) {
  return (
    <ChartErrorBoundary>
      <div className={`relative ${className}`}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-10 rounded-lg">
            <ChartLoading chartType={chartType} />
          </div>
        )}
        <Suspense fallback={<ChartSkeleton type={chartType} />}>
          {children}
        </Suspense>
      </div>
    </ChartErrorBoundary>
  );
}

// API Data com UX completo
export function APIDataWrapper({
  children,
  loading = false,
  dataType,
  className = "",
}: {
  children: ReactNode;
  loading?: boolean;
  dataType?:
    | "terapeutas"
    | "pacientes"
    | "sessoes"
    | "agendamentos"
    | "financeiro";
  className?: string;
}) {
  const getLoadingComponent = () => {
    switch (dataType) {
      case "terapeutas":
        return <TerapeutasLoading />;
      case "pacientes":
        return <PacientesLoading />;
      case "sessoes":
        return <SessoesLoading />;
      case "agendamentos":
        return <AgendamentosLoading />;
      case "financeiro":
        return <FinanceiroLoading />;
      default:
        return <LoadingState type="api" />;
    }
  };

  const getSkeletonComponent = () => {
    switch (dataType) {
      case "terapeutas":
      case "pacientes":
        return <ListSkeleton items={6} hasAvatar={true} />;
      case "sessoes":
      case "agendamentos":
        return <TableSkeleton rows={8} columns={5} />;
      case "financeiro":
        return <StatsSkeleton cards={4} />;
      default:
        return <CardSkeleton textLines={3} />;
    }
  };

  return (
    <APIErrorBoundary>
      <div className={`relative ${className}`}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10 rounded-lg">
            {getLoadingComponent()}
          </div>
        )}
        <Suspense fallback={getSkeletonComponent()}>{children}</Suspense>
      </div>
    </APIErrorBoundary>
  );
}

// Formulários com UX completo
export function FormUXWrapper({
  children,
  loading = false,
  saving = false,
  className = "",
}: {
  children: ReactNode;
  loading?: boolean;
  saving?: boolean;
  className?: string;
}) {
  return (
    <FormErrorBoundary>
      <div className={`relative ${className}`}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-10 rounded-lg">
            <LoadingState type="database" message="Carregando formulário..." />
          </div>
        )}
        {saving && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-10 rounded-lg">
            <LoadingState type="sync" message="Salvando dados..." />
          </div>
        )}
        <Suspense fallback={<FormSkeleton fields={5} />}>{children}</Suspense>
      </div>
    </FormErrorBoundary>
  );
}

// Tabelas com UX completo
export function TableUXWrapper({
  children,
  loading = false,
  rows = 6,
  columns = 4,
  className = "",
}: {
  children: ReactNode;
  loading?: boolean;
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <APIErrorBoundary>
      <div className={`relative ${className}`}>
        {loading && (
          <SectionLoadingOverlay
            type="database"
            message="Carregando dados..."
          />
        )}
        <Suspense fallback={<TableSkeleton rows={rows} columns={columns} />}>
          {children}
        </Suspense>
      </div>
    </APIErrorBoundary>
  );
}

// Hook para gerenciar estados de UX de forma consistente
export function useUXState(initialLoading = false) {
  const [loading, setLoading] = React.useState(initialLoading);
  const [error, setError] = React.useState<Error | null>(null);

  const startLoading = React.useCallback(() => {
    setLoading(true);
    setError(null);
  }, []);

  const stopLoading = React.useCallback(() => {
    setLoading(false);
  }, []);

  const setErrorState = React.useCallback((error: Error | string) => {
    setLoading(false);
    setError(typeof error === "string" ? new Error(error) : error);
  }, []);

  const reset = React.useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  return {
    loading,
    error,
    startLoading,
    stopLoading,
    setErrorState,
    reset,
    isReady: !loading && !error,
  };
}

// Higher Order Component para aplicar UX improvements automaticamente
export function withUXImprovements<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: {
    errorBoundary?: boolean;
    suspense?: boolean;
    loadingType?: "dashboard" | "chart" | "api" | "form" | "table";
    skeletonType?: "dashboard" | "chart" | "list" | "form" | "table";
  } = {},
) {
  const {
    errorBoundary = true,
    suspense = true,
    loadingType = "api",
    skeletonType = "list",
  } = options;

  return function UXEnhancedComponent(props: P) {
    const getSkeleton = () => {
      switch (skeletonType) {
        case "dashboard":
          return <FullDashboardSkeleton />;
        case "chart":
          return <ChartSkeleton />;
        case "list":
          return <ListSkeleton />;
        case "form":
          return <FormSkeleton />;
        case "table":
          return <TableSkeleton />;
        default:
          return <CardSkeleton />;
      }
    };

    let component = <WrappedComponent {...props} />;

    if (suspense) {
      component = <Suspense fallback={getSkeleton()}>{component}</Suspense>;
    }

    if (errorBoundary) {
      if (loadingType === "dashboard") {
        component = (
          <DashboardErrorBoundary>{component}</DashboardErrorBoundary>
        );
      } else if (loadingType === "chart") {
        component = <ChartErrorBoundary>{component}</ChartErrorBoundary>;
      } else if (loadingType === "form") {
        component = <FormErrorBoundary>{component}</FormErrorBoundary>;
      } else {
        component = <APIErrorBoundary>{component}</APIErrorBoundary>;
      }
    }

    return component;
  };
}

// Exportações para facilitar o uso
export {
  ErrorBoundary,
  APIErrorBoundary,
  ChartErrorBoundary,
  DashboardErrorBoundary,
  FormErrorBoundary,
  LoadingState,
  SectionLoadingOverlay,
  Skeleton,
  ChartSkeleton,
  FullDashboardSkeleton,
  StatsSkeleton,
};
