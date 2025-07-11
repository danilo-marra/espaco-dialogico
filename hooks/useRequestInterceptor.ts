import { useRouter } from "next/router";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";

interface RequestInterceptor {
  interceptResponse: (_response: Response) => Response;
  checkAuthStatus: () => Promise<boolean>;
}

const useRequestInterceptor = (): RequestInterceptor => {
  const router = useRouter();

  // Função para limpar sessão e redirecionar para login
  const forceLogout = useCallback(
    (
      message: string = "Sua sessão expirou. Por favor, faça login novamente.",
    ) => {
      // Limpar dados do localStorage
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");

      // Mostrar mensagem para o usuário
      toast.error(message);

      // Redirecionar para login
      router.push("/login");
    },
    [router],
  );

  // Interceptor para verificar responses e detectar 401
  const interceptResponse = useCallback(
    (response: Response): Response => {
      if (response.status === 401) {
        // Verificar se a mensagem de erro indica sessão inválida
        response
          .clone()
          .json()
          .then((data) => {
            if (
              data.error ===
                "Sessão inválida. Por favor, faça login novamente." ||
              data.error === "Token de autenticação não fornecido" ||
              data.error === "Token inválido ou malformado"
            ) {
              forceLogout();
            }
          })
          .catch(() => {
            // Se não conseguir ler a resposta, assumir que é erro de sessão
            forceLogout();
          });
      }
      return response;
    },
    [forceLogout],
  );

  // Função para verificar se o token ainda é válido
  const checkAuthStatus = useCallback(async (): Promise<boolean> => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      return false;
    }

    try {
      const response = await fetch("/api/v1/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        forceLogout("Sua sessão expirou. Por favor, faça login novamente.");
        return false;
      }

      return response.ok;
    } catch (error) {
      console.error("Erro ao verificar status de autenticação:", error);
      return false;
    }
  }, [forceLogout]);

  // Verificar periodicamente se a sessão ainda é válida
  useEffect(() => {
    const interval = setInterval(async () => {
      const isLoggedIn = localStorage.getItem("authToken");
      if (isLoggedIn && router.pathname !== "/login") {
        await checkAuthStatus();
      }
    }, 30000); // Verificar a cada 30 segundos

    return () => clearInterval(interval);
  }, [checkAuthStatus, router.pathname]);

  return {
    interceptResponse,
    checkAuthStatus,
  };
};

export default useRequestInterceptor;
