import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { usePermissions } from "../hooks/usePermissions";

interface RouteGuardProps {
  children: React.ReactNode;
}

const RouteGuard: React.FC<RouteGuardProps> = ({ children }) => {
  const router = useRouter();
  const { canAccessRoute, isLoading, userRole } = usePermissions();

  useEffect(() => {
    if (isLoading) return;

    // Verificar se a rota atual requer autenticação
    const publicRoutes = ["/login", "/register", "/"];
    const currentRoute = router.asPath;

    // Se é uma rota pública, permitir acesso
    if (
      publicRoutes.includes(currentRoute) ||
      currentRoute.startsWith("/site")
    ) {
      return;
    }

    // Se não tem usuário logado, redirecionar para login
    if (!userRole) {
      router.replace("/login");
      return;
    } // Se é uma rota protegida, verificar permissões
    if (currentRoute.startsWith("/dashboard")) {
      if (!canAccessRoute(currentRoute)) {
        // Redirecionar para uma rota que o usuário tem permissão
        if (userRole === "terapeuta") {
          router.replace("/dashboard/agenda");
        } else if (userRole === "secretaria") {
          router.replace("/dashboard/agenda");
        } else if (userRole === "admin") {
          router.replace("/dashboard");
        } else {
          router.replace("/login");
        }
        return;
      }
    }
  }, [router, canAccessRoute, isLoading, userRole]);

  // Mostrar loading enquanto verifica permissões
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RouteGuard;
