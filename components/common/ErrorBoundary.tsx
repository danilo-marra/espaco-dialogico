import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  onError?: (_error: Error, _errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorId: "",
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });

    // Log do erro para monitoramento
    console.error("🚨 ErrorBoundary capturou um erro:", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
    });

    // Callback personalizado
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Enviar erro para serviço de monitoramento (se configurado)
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("errorBoundary", {
          detail: {
            error: error.message,
            errorId: this.state.errorId,
            componentStack: errorInfo.componentStack,
          },
        }),
      );
    }
  }

  public componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (
        resetKeys?.some((key, index) => key !== prevProps.resetKeys?.[index])
      ) {
        this.resetErrorBoundary();
      }
    }

    if (
      hasError &&
      resetOnPropsChange &&
      prevProps.children !== this.props.children
    ) {
      this.resetErrorBoundary();
    }
  }

  private resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.resetTimeoutId = window.setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: "",
      });
    }, 100);
  };

  private handleRetry = () => {
    this.resetErrorBoundary();
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/dashboard";
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, errorId } = this.state;

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg border border-red-200">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Oops! Algo deu errado
                  </h3>
                  <p className="text-sm text-gray-500">
                    Ocorreu um erro inesperado nesta seção
                  </p>
                </div>
              </div>

              {/* Error Message */}
              <div className="mb-4">
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-sm text-red-800 font-medium">
                    {error?.message || "Erro desconhecido"}
                  </p>
                  {process.env.NODE_ENV === "development" && errorInfo && (
                    <details className="mt-2">
                      <summary className="text-xs text-red-600 cursor-pointer hover:text-red-700">
                        Detalhes técnicos
                      </summary>
                      <pre className="text-xs text-red-600 mt-1 overflow-x-auto whitespace-pre-wrap">
                        {error?.stack}
                      </pre>
                    </details>
                  )}
                </div>

                {/* Error ID */}
                <div className="mt-2 text-xs text-gray-500 flex items-center space-x-1">
                  <Bug className="h-3 w-3" />
                  <span>ID do erro: {errorId}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={this.handleRetry}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Tentar novamente</span>
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  <Home className="h-4 w-4" />
                  <span>Ir para Home</span>
                </button>

                <button
                  onClick={this.handleReload}
                  className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Recarregar</span>
                </button>
              </div>

              {/* Support Info */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Se o problema persistir, entre em contato com o suporte
                  técnico informando o ID do erro acima.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Error Boundaries específicos para diferentes seções
export function APIErrorBoundary({
  children,
  onError,
}: {
  children: ReactNode;
  onError?: (_error: Error) => void;
}) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error("🚨 API Error Boundary:", { error, errorInfo });
        if (onError) onError(error);
      }}
      fallback={
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <div>
              <h4 className="text-red-800 font-medium">Erro de API</h4>
              <p className="text-red-600 text-sm">
                Falha ao carregar dados do servidor
              </p>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 text-sm text-red-700 hover:text-red-800 underline"
          >
            Recarregar página
          </button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

export function ChartErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="h-64 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Erro ao carregar gráfico</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-sm text-blue-600 hover:text-blue-700 underline"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

export function DashboardErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-[600px] flex items-center justify-center">
          <div className="text-center max-w-md">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Erro no Dashboard
            </h2>
            <p className="text-gray-600 mb-4">
              Ocorreu um erro ao carregar o dashboard. Tente recarregar a
              página.
            </p>
            <div className="space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Recarregar
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                Voltar ao início
              </button>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

export function FormErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <h4 className="text-red-800 font-medium">Erro no formulário</h4>
              <p className="text-red-600 text-sm">
                Ocorreu um erro inesperado. Tente recarregar a página.
              </p>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;
