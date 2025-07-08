/**
 * Componente indicador de operações de marcação pendentes
 * Mostra progresso e permite controle manual das operações
 */

import React from "react";
import { useOptimizedMarking } from "hooks/useOptimizedMarking";

interface BatchOperationIndicatorProps {
  position?: "top-right" | "bottom-right" | "top-left" | "bottom-left";
  showDetails?: boolean;
  onSuccess?: () => void;
}

export function BatchOperationIndicator({
  position = "bottom-right",
  showDetails = true,
  onSuccess,
}: BatchOperationIndicatorProps) {
  const {
    isLoading,
    pendingCount,
    hasErrors,
    errors,
    lastProcessTime,
    processOperations,
    cancelPendingOperations,
  } = useOptimizedMarking({ onSuccess });

  // Não mostrar se não há operações pendentes e não está carregando
  if (pendingCount === 0 && !isLoading && !hasErrors) {
    return null;
  }

  const positionClasses = {
    "top-right": "top-4 right-4",
    "bottom-right": "bottom-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-left": "bottom-4 left-4",
  };

  const formatLastProcessTime = (timestamp: number | null) => {
    if (!timestamp) return null;

    const diff = Date.now() - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);

    if (minutes > 0) {
      return `${minutes}min atrás`;
    } else {
      return `${seconds}s atrás`;
    }
  };

  return (
    <div
      className={`fixed z-50 ${positionClasses[position]} max-w-sm`}
      role="status"
      aria-live="polite"
    >
      <div
        className={`
          bg-white border shadow-lg rounded-lg p-4 transition-all duration-300
          ${hasErrors ? "border-red-300" : isLoading ? "border-blue-300" : "border-gray-300"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {isLoading ? (
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
            ) : hasErrors ? (
              <div className="h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                <svg
                  className="h-3 w-3 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            ) : (
              <div className="h-4 w-4 bg-green-500 rounded-full flex items-center justify-center">
                <svg
                  className="h-3 w-3 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}

            <span className="text-sm font-medium text-gray-900">
              {isLoading
                ? "Processando..."
                : hasErrors
                  ? "Erros encontrados"
                  : "Marcações"}
            </span>
          </div>

          {pendingCount > 0 && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              {pendingCount}
            </span>
          )}
        </div>

        {/* Status Message */}
        <div className="text-sm text-gray-600 mb-3">
          {isLoading
            ? "Processando marcações..."
            : hasErrors
              ? `${errors.length} erro(s) encontrado(s)`
              : pendingCount > 0
                ? `${pendingCount} marcação${pendingCount > 1 ? "ões" : ""} pendente${pendingCount > 1 ? "s" : ""}`
                : "Todas as operações foram processadas"}
        </div>

        {/* Detalhes */}
        {showDetails && (
          <div className="space-y-2">
            {/* Últimas processameto */}
            {lastProcessTime && (
              <div className="text-xs text-gray-500">
                Último processamento: {formatLastProcessTime(lastProcessTime)}
              </div>
            )}

            {/* Erros */}
            {hasErrors && errors.length > 0 && (
              <div className="max-h-20 overflow-y-auto">
                {errors.slice(0, 3).map((error, index) => (
                  <div
                    key={index}
                    className="text-xs text-red-600 bg-red-50 p-1 rounded"
                  >
                    {error}
                  </div>
                ))}
                {errors.length > 3 && (
                  <div className="text-xs text-red-500">
                    +{errors.length - 3} erro(s) adicional(is)
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Ações */}
        <div className="flex space-x-2 mt-3">
          {pendingCount > 0 && !isLoading && (
            <button
              onClick={processOperations}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs py-1 px-2 rounded transition-colors"
              disabled={isLoading}
            >
              Processar Agora
            </button>
          )}

          {(pendingCount > 0 || hasErrors) && !isLoading && (
            <button
              onClick={cancelPendingOperations}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white text-xs py-1 px-2 rounded transition-colors"
              disabled={isLoading}
            >
              {hasErrors ? "Limpar" : "Cancelar"}
            </button>
          )}
        </div>

        {/* Progress bar para loading */}
        {isLoading && (
          <div className="mt-2">
            <div className="h-1 bg-gray-200 rounded overflow-hidden">
              <div className="h-full bg-blue-500 animate-pulse"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
