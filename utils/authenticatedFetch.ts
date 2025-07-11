import { toast } from "sonner";

// Tipo para opções de fetch customizadas
interface FetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  skipAuthCheck?: boolean;
}

// Função utilitária para fazer logout forçado
const forceLogout = (
  message: string = "Sua sessão expirou. Por favor, faça login novamente.",
) => {
  // Limpar dados do localStorage
  localStorage.removeItem("authToken");
  localStorage.removeItem("user");

  // Mostrar mensagem para o usuário
  toast.error(message);

  // Redirecionar para login
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
};

// Wrapper para fetch que intercepta erros 401
const authenticatedFetch = async (
  url: string,
  options: FetchOptions = {},
): Promise<Response> => {
  const { skipAuthCheck = false, ...fetchOptions } = options;

  // Adicionar token de autenticação se disponível e não for skipAuthCheck
  if (!skipAuthCheck) {
    const token = localStorage.getItem("authToken");
    if (token) {
      fetchOptions.headers = {
        ...fetchOptions.headers,
        Authorization: `Bearer ${token}`,
      };
    }
  }

  try {
    const response = await fetch(url, fetchOptions);

    // Interceptar erros 401 (não autenticado)
    if (response.status === 401 && !skipAuthCheck) {
      try {
        const data = await response.clone().json();
        if (
          data.error === "Sessão inválida. Por favor, faça login novamente." ||
          data.error === "Token de autenticação não fornecido" ||
          data.error === "Token inválido ou malformado" ||
          data.error === "Não autorizado"
        ) {
          forceLogout();
        }
      } catch (error) {
        // Se não conseguir ler a resposta, assumir que é erro de sessão
        console.error("Erro ao processar resposta 401:", error);
        forceLogout();
      }
    }

    return response;
  } catch (error) {
    console.error("Erro na requisição:", error);
    throw error;
  }
};

export { authenticatedFetch, forceLogout };
export type { FetchOptions };
