import React from "react";

// Skeleton para cards de estatísticas individuais
export function StatCardSkeleton() {
  return (
    <div className="bg-white p-6 rounded-lg shadow animate-pulse">
      <div className="flex items-center justify-between space-y-0 pb-2">
        <div className="h-4 bg-gray-200 rounded w-20"></div>
        <div className="h-4 w-4 bg-gray-200 rounded"></div>
      </div>
      <div className="space-y-2">
        <div className="h-8 bg-gray-200 rounded w-16"></div>
        <div className="h-3 bg-gray-200 rounded w-32"></div>
      </div>
    </div>
  );
}

// Skeleton para gráficos de barra com animação realista
export function BarChartSkeleton() {
  return (
    <div className="bg-white p-6 rounded-lg shadow animate-pulse">
      <div className="space-y-2 mb-4">
        <div className="h-6 bg-gray-200 rounded w-32"></div>
        <div className="h-4 bg-gray-200 rounded w-48"></div>
      </div>
      <div className="h-80 flex items-end justify-between space-x-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex-1 flex flex-col items-center">
            <div
              className="w-full bg-gradient-to-t from-blue-100 to-blue-200 rounded-t animate-pulse"
              style={{
                height: `${Math.random() * 200 + 50}px`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
            <div className="h-3 w-8 mt-2 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton para gráficos de linha
export function LineChartSkeleton() {
  return (
    <div className="bg-white p-6 rounded-lg shadow animate-pulse">
      <div className="space-y-2 mb-4">
        <div className="h-6 bg-gray-200 rounded w-32"></div>
        <div className="h-4 bg-gray-200 rounded w-48"></div>
      </div>
      <div className="h-80 relative">
        {/* Eixo Y */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-3 w-12 bg-gray-200 rounded"></div>
          ))}
        </div>

        {/* Área do gráfico */}
        <div className="ml-16 h-full relative">
          {/* Linha simulada */}
          <svg className="w-full h-full" viewBox="0 0 400 300">
            <path
              d="M 0,150 Q 100,100 200,120 T 400,80"
              stroke="#e2e8f0"
              strokeWidth="3"
              fill="none"
              className="animate-pulse"
            />
            <path
              d="M 0,150 Q 100,100 200,120 T 400,80"
              stroke="#cbd5e1"
              strokeWidth="2"
              fill="none"
              className="animate-pulse"
              style={{ animationDelay: "0.5s" }}
            />
          </svg>

          {/* Eixo X */}
          <div className="absolute bottom-0 w-full flex justify-between">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-3 w-8 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Skeleton para gráficos de pizza
export function PieChartSkeleton() {
  return (
    <div className="bg-white p-6 rounded-lg shadow animate-pulse">
      <div className="space-y-2 mb-4">
        <div className="h-6 bg-gray-200 rounded w-32"></div>
        <div className="h-4 bg-gray-200 rounded w-48"></div>
      </div>
      <div className="h-80 flex items-center justify-center">
        <div className="relative">
          {/* Círculo principal */}
          <div className="w-48 h-48 rounded-full border-8 border-gray-200 animate-pulse" />

          {/* Segmentos simulados */}
          <div
            className="absolute inset-0 w-48 h-48 rounded-full border-8 border-transparent border-t-blue-200 animate-spin"
            style={{ animationDuration: "3s" }}
          />
          <div
            className="absolute inset-0 w-48 h-48 rounded-full border-8 border-transparent border-r-green-200 animate-spin"
            style={{ animationDuration: "4s", animationDirection: "reverse" }}
          />
          <div
            className="absolute inset-0 w-48 h-48 rounded-full border-8 border-transparent border-b-yellow-200 animate-spin"
            style={{ animationDuration: "5s" }}
          />
        </div>
      </div>

      {/* Legenda */}
      <div className="mt-4 space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-2">
            <div className="h-3 w-3 rounded-full bg-gray-200"></div>
            <div className="h-3 w-20 bg-gray-200 rounded"></div>
            <div className="h-3 w-8 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton principal do dashboard
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Cards de estatísticas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Gráficos principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChartSkeleton />
        <LineChartSkeleton />
      </div>

      {/* Gráficos secundários */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PieChartSkeleton />
        <BarChartSkeleton />
      </div>
    </div>
  );
}

// Skeleton para componentes individuais de gráfico
export function ChartLoadingSkeleton({
  type = "bar",
}: {
  type?: "bar" | "line" | "pie";
}) {
  switch (type) {
    case "line":
      return <LineChartSkeleton />;
    case "pie":
      return <PieChartSkeleton />;
    default:
      return <BarChartSkeleton />;
  }
}
