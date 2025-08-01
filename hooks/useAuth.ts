import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { authenticatedFetch, forceLogout } from "utils/authenticatedFetch";

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  name?: string;
  token_version?: number;
}

interface AuthHook {
  user: User | null;
  loading: boolean;
  login: (_email: string, _password: string) => Promise<void>;
  logout: () => void;
  logoutAll: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  canEdit: boolean;
}

const useAuth = (): AuthHook => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Carrega o usuário do localStorage na inicialização
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
      }
    }
    setLoading(false);
  }, []);

  // Função de login
  const login = useCallback(
    async (loginEmail: string, loginPassword: string) => {
      setLoading(true);
      try {
        const response = await authenticatedFetch("/api/v1/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: loginEmail, password: loginPassword }),
          skipAuthCheck: true, // Login não precisa de token
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erro ao fazer login");
        }

        // Salvar token e usuário no localStorage
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // Atualizar estado com dados do usuário
        setUser(data.user);

        toast.success("Login realizado com sucesso!");
        router.push("/dashboard");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Erro ao fazer login",
        );
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  // Função de logout
  const logout = useCallback(() => {
    forceLogout("Você foi desconectado com sucesso.");
  }, []);

  // Função de logout completo (todos os dispositivos)
  const logoutAll = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (token) {
        await authenticatedFetch("/api/v1/auth/logout-all", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
      }
    } catch (error) {
      console.error("Erro ao fazer logout completo:", error);
    } finally {
      // Limpar dados locais independentemente do resultado
      forceLogout("Você foi desconectado de todos os dispositivos.");
    }
  }, []);

  return {
    user,
    loading,
    login,
    logout,
    logoutAll,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    canEdit: user?.role === "admin" || user?.role === "secretaria",
  };
};

export default useAuth;
