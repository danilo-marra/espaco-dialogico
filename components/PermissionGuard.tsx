import React from "react";
import { usePermissions } from "../hooks/usePermissions";

interface PermissionGuardProps {
  resource: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showLoading?: boolean;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({
  resource,
  children,
  fallback = null,
  showLoading = true,
}) => {
  const { hasPermission, isLoading } = usePermissions();

  if (isLoading && showLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!hasPermission(resource)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <div className="text-yellow-800">
          <h3 className="text-lg font-medium mb-2">Acesso Restrito</h3>
          <p className="text-sm">
            Você não tem permissão para acessar este recurso.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default PermissionGuard;
