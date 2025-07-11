import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";

interface AuthContextType {
  checkAuthStatus: () => Promise<boolean>;
  isChecking: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext deve ser usado dentro de um AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isChecking, setIsChecking] = useState(false);
  const router = useRouter();

  // Função para verificar se o token ainda é válido
  const checkAuthStatus = async (): Promise<boolean> => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      return false;
    }

    setIsChecking(true);
    try {
      // Usar fetch diretamente para evitar loop com o interceptor
      const response = await fetch("/api/v1/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const isValid = response.ok;
      if (!isValid && response.status === 401) {
        // Se 401, limpar dados locais
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        return false;
      }

      return isValid;
    } catch (error) {
      console.error("Erro ao verificar status de autenticação:", error);
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  // Verificar periodicamente se a sessão ainda é válida
  useEffect(() => {
    // Verificar apenas se o usuário está logado e não está na página de login
    const shouldCheck = () => {
      const token = localStorage.getItem("authToken");
      return token && router.pathname !== "/login";
    };

    const interval = setInterval(async () => {
      if (shouldCheck()) {
        await checkAuthStatus();
      }
    }, 30000); // Verificar a cada 30 segundos

    return () => clearInterval(interval);
  }, [router.pathname]);

  // Verificar ao carregar a página
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token && router.pathname !== "/login") {
      checkAuthStatus();
    }
  }, [router.pathname]);

  return (
    <AuthContext.Provider value={{ checkAuthStatus, isChecking }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
