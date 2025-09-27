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

// Configurar interceptores, se necessário
axiosInstance.interceptors.request.use(
  (config) => {
    // Adicionar token de autenticação, se necessário
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("authToken");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Adicionar timestamp para monitoramento de performance
    (config as any).metadata = { startTime: Date.now() };

    return config;
  },
  (error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
  (response) => {
    // Log de performance para debugging
    if ((response.config as any).metadata) {
      const duration = Date.now() - (response.config as any).metadata.startTime;
      if (duration > 10000) {
        // Log requisições que demoram mais de 10s
        console.warn(
          `Slow API request: ${response.config.url} took ${duration}ms`,
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

    // Log de erros para debugging
    if ((error.config as any)?.metadata) {
      const duration = Date.now() - (error.config as any).metadata.startTime;
      console.error(
        `API request failed after ${duration}ms: ${error.config?.url}`,
        {
          status: error.response?.status,
          message: error.message,
        },
      );
    }

    // Tratar erros de resposta globalmente
    return Promise.reject(error);
  },
);

export default axiosInstance;
