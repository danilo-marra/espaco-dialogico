import axios from "axios";

// Detectar ambiente para configurar timeout apropriado
const isProduction =
  process.env.NODE_ENV === "production" ||
  process.env.VERCEL_ENV === "production";
const isStaging = process.env.VERCEL_ENV === "preview";

// Timeout otimizado baseado no ambiente
const getTimeout = () => {
  if (isStaging) return 30000; // 30s para staging
  if (isProduction) return 45000; // 45s para produção
  return 60000; // 60s para desenvolvimento
};

// Criar uma instância personalizada do axios com baseURL definida
export const axiosInstance = axios.create({
  // Use a URL atual do site como base para as requisições
  baseURL:
    typeof window !== "undefined"
      ? "/api/v1/" // No cliente, use caminho relativo
      : process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1/", // No servidor, use URL completa

  // Configurações de timeout otimizadas
  timeout: getTimeout(),
});

// Configurar interceptadores otimizados
axiosInstance.interceptors.request.use(
  (config) => {
    // Adicionar token de autenticação
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("authToken");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Metadata para monitoramento detalhado
    (config as any).metadata = {
      startTime: performance.now(),
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url: config.url,
      method: config.method?.toUpperCase(),
    };

    // Log de debug em desenvolvimento
    if (process.env.NODE_ENV === "development") {
      console.log(
        `🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`,
      );
    }

    return config;
  },
  (error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
  (response) => {
    // Monitoramento detalhado de performance
    if ((response.config as any).metadata) {
      const metadata = (response.config as any).metadata;
      const duration = performance.now() - metadata.startTime;

      // Adicionar headers de performance na resposta
      response.headers["x-response-time"] = `${Math.round(duration)}ms`;
      response.headers["x-request-id"] = metadata.requestId;

      // Logs estruturados por categoria de performance
      if (process.env.NODE_ENV === "development") {
        const emoji =
          duration < 100
            ? "⚡"
            : duration < 500
              ? "🟡"
              : duration < 1000
                ? "🟠"
                : "🔴";
        console.log(
          `${emoji} ${metadata.method} ${metadata.url} - ${Math.round(duration)}ms`,
        );
      }

      // Alertas para diferentes limiares
      if (duration > 2000) {
        console.warn(
          `🐌 Very slow API: ${metadata.method} ${metadata.url} - ${Math.round(duration)}ms`,
        );
      } else if (duration > 1000) {
        console.warn(
          `⏰ Slow API: ${metadata.method} ${metadata.url} - ${Math.round(duration)}ms`,
        );
      }

      // Dispatch evento customizado para monitoramento global
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("apiPerformance", {
            detail: {
              url: metadata.url,
              method: metadata.method,
              duration: Math.round(duration),
              status: response.status,
              requestId: metadata.requestId,
              timestamp: Date.now(),
            },
          }),
        );
      }
    }

    return response;
  },
  async (error) => {
    // Implementar retry manual para operações de marcação
    const config = error.config;

    // Verificar se é uma operação que deve ter retry
    const shouldRetry =
      config &&
      !(config as any).__isRetryRequest &&
      config.url &&
      (config.url.includes("/agendamentos/") ||
        config.url.includes("/batch-update")) &&
      (error.code === "ECONNABORTED" || error.response?.status >= 500);

    if (shouldRetry) {
      (config as any).__isRetryRequest = true;
      (config as any).__retryCount = ((config as any).__retryCount || 0) + 1;

      // Máximo 2 tentativas
      if ((config as any).__retryCount <= 2) {
        // Delay exponencial
        const delay = Math.pow(2, (config as any).__retryCount) * 1000;

        console.log(
          `Retrying request (${(config as any).__retryCount}/2) after ${delay}ms: ${config.url}`,
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
        return axiosInstance(config);
      }
    }

    // Log estruturado de erros
    if ((error.config as any)?.metadata) {
      const metadata = (error.config as any).metadata;
      const duration = performance.now() - metadata.startTime;

      console.error(`❌ API Error: ${metadata.method} ${metadata.url}`, {
        duration: `${Math.round(duration)}ms`,
        status: error.response?.status,
        message: error.message,
        requestId: metadata.requestId,
      });

      // Dispatch evento de erro para monitoramento
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("apiError", {
            detail: {
              url: metadata.url,
              method: metadata.method,
              duration: Math.round(duration),
              status: error.response?.status || 0,
              message: error.message,
              requestId: metadata.requestId,
              timestamp: Date.now(),
            },
          }),
        );
      }
    }

    // Tratar erros de resposta globalmente
    return Promise.reject(error);
  },
);

export default axiosInstance;
