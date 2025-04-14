import axios from "axios";

// Criar uma instância personalizada do axios com baseURL definida
export const axiosInstance = axios.create({
  // Use a URL atual do site como base para as requisições
  baseURL:
    typeof window !== "undefined"
      ? "/api/v1" // No cliente, use caminho relativo
      : process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1", // No servidor, use URL completa
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
    return config;
  },
  (error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Tratar erros de resposta globalmente
    return Promise.reject(error);
  },
);

export default axiosInstance;
