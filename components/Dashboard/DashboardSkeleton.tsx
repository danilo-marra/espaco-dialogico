import React from "react";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Cards de estatísticas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded w-16"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
            <div className="space-y-2 mb-4">
              <div className="h-6 bg-gray-200 rounded w-32"></div>
              <div className="h-4 bg-gray-200 rounded w-48"></div>
            </div>
            <div className="h-[300px] bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>

      {/* Gráfico grande */}
      <div className="bg-white p-6 rounded-lg shadow animate-pulse">
        <div className="space-y-2 mb-4">
          <div className="h-6 bg-gray-200 rounded w-40"></div>
          <div className="h-4 bg-gray-200 rounded w-56"></div>
        </div>
        <div className="h-[400px] bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}
