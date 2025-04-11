import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  name?: string;
}

interface AuthHook {
  user: User | null;
  loading: boolean;
  login: (_email: string, _password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
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
        const response = await fetch("/api/v1/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: loginEmail, password: loginPassword }),
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
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setUser(null);
    router.push("/login");
  }, [router]);

  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
  };
};

export default useAuth;
