import React from "react";
import { User, X } from "@phosphor-icons/react";
import { useRouter } from "next/router";

interface FirstAccessAlertProps {
  terapeutaName: string;
  onDismiss: () => void;
}

export function FirstAccessAlert({
  terapeutaName,
  onDismiss,
}: FirstAccessAlertProps) {
  const router = useRouter();

  const handleGoToProfile = () => {
    onDismiss();
    router.push("/dashboard/perfil");
  };

  return (
    <div className="mb-6 rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <User className="h-6 w-6 text-blue-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-900">
              Bem-vindo(a) ao Espaço Dialógico, {terapeutaName}!
            </h3>
            <p className="mt-1 text-sm text-blue-700">
              Para aproveitar ao máximo a plataforma, complete seu perfil
              profissional adicionando informações como especialidades,
              descrição e dados de contato.
            </p>
            <div className="mt-3 flex space-x-3">
              <button
                onClick={handleGoToProfile}
                className="rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Completar Perfil
              </button>
              <button
                onClick={onDismiss}
                className="rounded-md bg-blue-100 px-3 py-2 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Lembrar Depois
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="flex-shrink-0 rounded-md p-1 text-blue-400 transition-colors hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
