import React from "react";

// Base Skeleton Component com animação suave
interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: "rectangular" | "circular" | "text";
  animation?: "pulse" | "wave" | "none";
  children?: React.ReactNode;
}

export function Skeleton({
  className = "",
  width,
  height,
  variant = "rectangular",
  animation = "pulse",
  children,
}: SkeletonProps) {
  const baseClasses = "bg-gray-200";

  const variantClasses = {
    rectangular: "rounded",
    circular: "rounded-full",
    text: "rounded h-4",
  };

  const animationClasses = {
    pulse: "animate-pulse",
    wave: "animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]",
    none: "",
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === "number" ? `${width}px` : width;
  if (height)
    style.height = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      className={`
        ${baseClasses} 
        ${variantClasses[variant]} 
        ${animationClasses[animation]} 
        ${className}
      `}
      style={style}
    >
      {children}
    </div>
  );
}

// Skeleton para texto com múltiplas linhas
export function TextSkeleton({
  lines = 1,
  className = "",
  lastLineWidth = "75%",
}: {
  lines?: number;
  className?: string;
  lastLineWidth?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          width={index === lines - 1 && lines > 1 ? lastLineWidth : "100%"}
          className="h-4"
        />
      ))}
    </div>
  );
}

// Skeleton para avatar/foto
export function AvatarSkeleton({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };

  return (
    <Skeleton
      variant="circular"
      className={`${sizeClasses[size]} ${className}`}
    />
  );
}

// Skeleton para botão
export function ButtonSkeleton({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    sm: "h-8 w-20",
    md: "h-10 w-24",
    lg: "h-12 w-32",
  };

  return <Skeleton className={`${sizeClasses[size]} ${className}`} />;
}

// Skeleton para card completo
export function CardSkeleton({
  hasAvatar = false,
  hasImage = false,
  textLines = 3,
  className = "",
}: {
  hasAvatar?: boolean;
  hasImage?: boolean;
  textLines?: number;
  className?: string;
}) {
  return (
    <div className={`bg-white p-4 rounded-lg border ${className}`}>
      {/* Header com avatar opcional */}
      <div className="flex items-center space-x-3 mb-4">
        {hasAvatar && <AvatarSkeleton size="md" />}
        <div className="flex-1">
          <Skeleton width="60%" height="20" className="mb-2" />
          <Skeleton width="40%" height="16" />
        </div>
      </div>

      {/* Imagem opcional */}
      {hasImage && <Skeleton height="200" className="mb-4 rounded" />}

      {/* Conteúdo de texto */}
      <TextSkeleton lines={textLines} />

      {/* Footer com botões */}
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
        <div className="flex space-x-2">
          <ButtonSkeleton size="sm" />
          <ButtonSkeleton size="sm" />
        </div>
        <Skeleton width="80" height="16" />
      </div>
    </div>
  );
}

// Skeleton para tabela
export function TableSkeleton({
  rows = 5,
  columns = 4,
  className = "",
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-lg border overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gray-50 border-b p-4">
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={`header-${index}`} height="16" width="80%" />
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="p-4">
            <div className="grid grid-cols-4 gap-4 items-center">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton
                  key={`cell-${rowIndex}-${colIndex}`}
                  height="16"
                  width={colIndex === 0 ? "90%" : "70%"}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton para lista
export function ListSkeleton({
  items = 5,
  hasAvatar = true,
  className = "",
}: {
  items?: number;
  hasAvatar?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-lg border divide-y divide-gray-100 ${className}`}
    >
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="p-4 flex items-center space-x-3">
          {hasAvatar && <AvatarSkeleton size="md" />}
          <div className="flex-1">
            <Skeleton width="60%" height="16" className="mb-2" />
            <Skeleton width="40%" height="14" />
          </div>
          <div className="flex space-x-2">
            <ButtonSkeleton size="sm" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Skeleton para formulário
export function FormSkeleton({
  fields = 4,
  className = "",
}: {
  fields?: number;
  className?: string;
}) {
  return (
    <div className={`bg-white p-6 rounded-lg border ${className}`}>
      <div className="space-y-6">
        {Array.from({ length: fields }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton width="25%" height="16" />
            <Skeleton height="40" className="w-full" />
          </div>
        ))}

        {/* Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
          <ButtonSkeleton size="md" />
          <ButtonSkeleton size="md" />
        </div>
      </div>
    </div>
  );
}

// Skeleton para estatísticas/métricas
export function StatsSkeleton({
  cards = 4,
  className = "",
}: {
  cards?: number;
  className?: string;
}) {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}
    >
      {Array.from({ length: cards }).map((_, index) => (
        <div key={index} className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <Skeleton width="60%" height="16" />
            <Skeleton width="20" height="20" variant="circular" />
          </div>
          <div className="space-y-2">
            <Skeleton width="40%" height="32" />
            <Skeleton width="80%" height="14" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Skeleton para gráfico melhorado
export function ChartSkeleton({
  type = "bar",
  className = "",
}: {
  type?: "bar" | "line" | "pie" | "area";
  className?: string;
}) {
  return (
    <div className={`bg-white p-6 rounded-lg border ${className}`}>
      {/* Título */}
      <div className="mb-6">
        <Skeleton width="40%" height="24" className="mb-2" />
        <Skeleton width="60%" height="16" />
      </div>

      {/* Gráfico */}
      <div className="h-80 flex items-end justify-between space-x-2">
        {type === "bar" && (
          <>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <Skeleton
                  height={`${Math.random() * 200 + 50}px`}
                  className="w-full mb-2"
                  animation="wave"
                />
                <Skeleton width="32" height="12" />
              </div>
            ))}
          </>
        )}

        {type === "line" && (
          <div className="w-full h-full relative">
            <svg className="w-full h-full" viewBox="0 0 400 300">
              <defs>
                <linearGradient id="shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#e2e8f0" />
                  <stop offset="50%" stopColor="#f1f5f9" />
                  <stop offset="100%" stopColor="#e2e8f0" />
                </linearGradient>
              </defs>
              <path
                d="M 0,150 Q 100,100 200,120 T 400,80"
                stroke="url(#shimmer)"
                strokeWidth="3"
                fill="none"
                className="animate-pulse"
              />
            </svg>
          </div>
        )}

        {type === "pie" && (
          <div className="w-full flex justify-center items-center">
            <div className="relative">
              <Skeleton
                width="200px"
                height="200px"
                variant="circular"
                animation="wave"
              />
              <div className="absolute inset-8">
                <Skeleton
                  width="100%"
                  height="100%"
                  variant="circular"
                  className="bg-white"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legenda */}
      <div className="mt-4 flex justify-center space-x-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-2">
            <Skeleton width="12" height="12" variant="circular" />
            <Skeleton width="48" height="14" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton para página completa do dashboard
export function FullDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Skeleton width="200px" height="32" className="mb-2" />
          <Skeleton width="300px" height="16" />
        </div>
        <ButtonSkeleton size="lg" />
      </div>

      {/* Stats Cards */}
      <StatsSkeleton cards={4} />

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton type="bar" />
        <ChartSkeleton type="line" />
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton type="pie" />
        <ChartSkeleton type="area" />
      </div>

      {/* Data Table */}
      <TableSkeleton rows={6} columns={5} />
    </div>
  );
}
