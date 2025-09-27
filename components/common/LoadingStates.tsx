import React from "react";
import { Loader2, RefreshCw, Clock, Database, Wifi } from "lucide-react";

// Tipos de loading states
export type LoadingType = "default" | "api" | "sync" | "database" | "network";

interface LoadingStateProps {
  type?: LoadingType;
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

// Configurações para cada tipo de loading
const loadingConfigs = {
  default: {
    icon: Loader2,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    message: "Carregando...",
  },
  api: {
    icon: RefreshCw,
    color: "text-green-600",
    bgColor: "bg-green-50",
    message: "Buscando dados...",
  },
  sync: {
    icon: Clock,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    message: "Sincronizando...",
  },
  database: {
    icon: Database,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    message: "Processando...",
  },
  network: {
    icon: Wifi,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    message: "Conectando...",
  },
};

const sizeConfigs = {
  sm: { iconSize: "h-4 w-4", textSize: "text-sm", padding: "p-2" },
  md: { iconSize: "h-5 w-5", textSize: "text-base", padding: "p-3" },
  lg: { iconSize: "h-6 w-6", textSize: "text-lg", padding: "p-4" },
};

// Loading state principal
export function LoadingState({
  type = "default",
  message,
  size = "md",
  className = "",
}: LoadingStateProps) {
  const config = loadingConfigs[type];
  const sizeConfig = sizeConfigs[size];
  const Icon = config.icon;

  return (
    <div
      className={`
      flex items-center justify-center space-x-2 
      ${config.bgColor} ${sizeConfig.padding} rounded-lg border
      ${className}
    `}
    >
      <Icon className={`${config.color} ${sizeConfig.iconSize} animate-spin`} />
      <span className={`${config.color} ${sizeConfig.textSize} font-medium`}>
        {message || config.message}
      </span>
    </div>
  );
}

// Loading inline para uso em botões
export function InlineLoading({
  type = "default",
  message,
  size = "sm",
  className = "",
}: LoadingStateProps) {
  const config = loadingConfigs[type];
  const sizeConfig = sizeConfigs[size];
  const Icon = config.icon;

  return (
    <span className={`flex items-center space-x-1 ${className}`}>
      <Icon className={`${config.color} ${sizeConfig.iconSize} animate-spin`} />
      {message && (
        <span className={`${config.color} ${sizeConfig.textSize}`}>
          {message}
        </span>
      )}
    </span>
  );
}

// Loading overlay para seções específicas
export function SectionLoadingOverlay({
  type = "default",
  message,
  size = "md",
  className = "",
}: LoadingStateProps) {
  return (
    <div
      className={`
      absolute inset-0 flex items-center justify-center
      bg-white/80 backdrop-blur-sm z-10 rounded-lg
      ${className}
    `}
    >
      <LoadingState type={type} message={message} size={size} />
    </div>
  );
}

// Loading states específicos para diferentes seções
export function DashboardLoading() {
  return (
    <LoadingState
      type="api"
      message="Carregando dashboard..."
      size="lg"
      className="my-8"
    />
  );
}

export function TerapeutasLoading() {
  return (
    <LoadingState
      type="database"
      message="Carregando terapeutas..."
      size="md"
    />
  );
}

export function PacientesLoading() {
  return (
    <LoadingState type="database" message="Carregando pacientes..." size="md" />
  );
}

export function SessoesLoading() {
  return <LoadingState type="sync" message="Carregando sessões..." size="md" />;
}

export function AgendamentosLoading() {
  return (
    <LoadingState type="api" message="Carregando agendamentos..." size="md" />
  );
}

export function FinanceiroLoading() {
  return (
    <LoadingState
      type="database"
      message="Calculando dados financeiros..."
      size="lg"
    />
  );
}

export function ChartLoading({ chartType }: { chartType?: string }) {
  return (
    <LoadingState
      type="api"
      message={`Carregando gráfico${chartType ? ` de ${chartType}` : ""}...`}
      size="md"
      className="h-32"
    />
  );
}

// Loading para operações específicas
export function SaveLoading() {
  return <InlineLoading type="sync" message="Salvando..." size="sm" />;
}

export function DeleteLoading() {
  return <InlineLoading type="database" message="Excluindo..." size="sm" />;
}

export function RefreshLoading() {
  return <InlineLoading type="api" message="Atualizando..." size="sm" />;
}

export function NetworkLoading() {
  return (
    <LoadingState type="network" message="Verificando conexão..." size="md" />
  );
}
