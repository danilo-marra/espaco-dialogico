import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import React from "react";

// Definição de permissões por role (espelhando o backend)
const ROLE_PERMISSIONS = {
  admin: [
    "agendamentos",
    "pacientes",
    "sessoes",
    "terapeutas",
    "transacoes",
    "convites",
    "usuarios",
    "perfil",
  ],
  terapeuta: ["agendamentos", "perfil"],
  secretaria: [
    "agendamentos",
    "pacientes",
    "sessoes",
    "terapeutas",
    "transacoes",
    "perfil",
  ],
};

// Mapeamento de rotas para recursos
const ROUTE_RESOURCE_MAP = {
  "/dashboard": "agendamentos", // Redireciona usuários para agenda por padrão
  "/dashboard/agenda": "agendamentos",
  "/dashboard/pacientes": "pacientes",
  "/dashboard/sessoes": "sessoes",
  "/dashboard/terapeutas": "terapeutas",
  "/dashboard/transacoes": "transacoes",
  "/dashboard/convites": "convites",
  "/dashboard/usuarios": "usuarios",
  "/dashboard/perfil": "perfil",
};

/**
 * Hook para verificar permissões do usuário
 * @returns {object} Objeto com funções e estados relacionados às permissões
 */
export function usePermissions() {
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setUserRole(user.role || "terapeuta");
      }
    } catch (error) {
      console.error("Erro ao recuperar dados do usuário:", error);
      setUserRole("terapeuta"); // Fallback para role básico
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Verifica se o usuário tem permissão para um recurso específico
   * @param {string} resource - Nome do recurso
   * @returns {boolean} Se tem permissão ou não
   */
  const hasPermission = (resource) => {
    if (!userRole) return false;
    const permissions = ROLE_PERMISSIONS[userRole];
    return permissions && permissions.includes(resource);
  };

  /**
   * Verifica se o usuário pode acessar uma rota específica
   * @param {string} route - Rota que está sendo verificada
   * @returns {boolean} Se pode acessar ou não
   */
  const canAccessRoute = (route) => {
    const resource = getResourceFromRoute(route);
    return resource ? hasPermission(resource) : false;
  };

  /**
   * Obtém o recurso baseado na rota
   * @param {string} route - Rota
   * @returns {string|null} Nome do recurso ou null
   */
  const getResourceFromRoute = (route) => {
    const cleanRoute = route.split("?")[0].split("#")[0];

    if (ROUTE_RESOURCE_MAP[cleanRoute]) {
      return ROUTE_RESOURCE_MAP[cleanRoute];
    }

    for (const routePattern in ROUTE_RESOURCE_MAP) {
      if (cleanRoute.startsWith(routePattern)) {
        return ROUTE_RESOURCE_MAP[routePattern];
      }
    }

    return null;
  };

  /**
   * Redireciona o usuário se ele não tiver permissão para a rota atual
   */
  const checkCurrentRoutePermission = () => {
    if (isLoading || !userRole) return;

    const currentRoute = router.asPath;
    const resource = getResourceFromRoute(currentRoute);

    if (resource && !hasPermission(resource)) {
      // Redirecionar para a primeira rota que o usuário tem permissão
      const userPermissions = ROLE_PERMISSIONS[userRole];
      if (userPermissions && userPermissions.length > 0) {
        const firstPermission = userPermissions[0];

        // Mapear o primeiro recurso permitido para uma rota
        const allowedRoute = Object.entries(ROUTE_RESOURCE_MAP).find(
          ([_, resourceName]) => resourceName === firstPermission,
        )?.[0];

        if (allowedRoute) {
          router.replace(allowedRoute);
        }
      } else {
        // Se não tem nenhuma permissão, redirecionar para login
        router.replace("/login");
      }
    }
  };

  /**
   * Obtém todas as permissões do usuário atual
   * @returns {string[]} Array com os recursos que o usuário pode acessar
   */
  const getUserPermissions = () => {
    if (!userRole) return [];
    return ROLE_PERMISSIONS[userRole] || [];
  };

  /**
   * Verifica se o usuário é admin
   * @returns {boolean} Se é admin ou não
   */
  const isAdmin = () => {
    return userRole === "admin";
  };
  /**
   * Verifica se o usuário é um terapeuta
   * @returns {boolean} Se é terapeuta ou não
   */
  const isTerapeuta = () => {
    return userRole === "terapeuta";
  };

  /**
   * Verifica se o usuário é da secretaria
   * @returns {boolean} Se é da secretaria ou não
   */
  const isSecretaria = () => {
    return userRole === "secretaria";
  };
  return {
    userRole,
    isLoading,
    hasPermission,
    canAccessRoute,
    checkCurrentRoutePermission,
    getUserPermissions,
    isAdmin,
    isTerapeuta,
    isSecretaria,
    getResourceFromRoute,
  };
}

/**
 * Componente wrapper para proteger conteúdo baseado em permissões
 * @param {object} props - Props do componente
 * @param {string} props.resource - Recurso necessário para ver o conteúdo
 * @param {React.ReactNode} props.children - Conteúdo a ser renderizado se tiver permissão
 * @param {React.ReactNode} props.fallback - Conteúdo a ser renderizado se não tiver permissão
 * @returns {React.ReactNode} Componente renderizado
 */
export function PermissionGuard({ resource, children, fallback = null }) {
  const { hasPermission, isLoading } = usePermissions();

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (!hasPermission(resource)) {
    return fallback;
  }

  return children;
}

export { ROLE_PERMISSIONS, ROUTE_RESOURCE_MAP };
