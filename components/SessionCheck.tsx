import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { authenticatedFetch } from "utils/authenticatedFetch";
import { toast } from "sonner";

interface SessionCheckProps {
  children: React.ReactNode;
}

const SessionCheck: React.FC<SessionCheckProps> = ({ children }) => {
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem("authToken");

      if (!token) {
        setIsAuthenticated(false);
        setIsValidating(false);
        return;
      }

      try {
        const response = await authenticatedFetch("/api/v1/me", {
          method: "GET",
        });

        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          // O interceptor já vai lidar com o logout em caso de 401
        }
      } catch (error) {
        console.error("Erro ao verificar sessão:", error);
        setIsAuthenticated(false);
        toast.error(
          "Erro ao verificar sessão. Por favor, faça login novamente.",
        );
        router.push("/login");
      } finally {
        setIsValidating(false);
      }
    };

    // Só verificar se não estamos na página de login
    if (router.pathname !== "/login") {
      checkSession();
    } else {
      setIsValidating(false);
    }
  }, [router]);

  // Mostrar loading enquanto valida
  if (isValidating) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Se não está autenticado e não está na página de login, não renderizar
  if (!isAuthenticated && router.pathname !== "/login") {
    return null;
  }

  return <>{children}</>;
};

export default SessionCheck;
