import React from "react";
import { useDashboardStats } from "../../hooks/useDashboardStats";

export function TestePacientesOrigem() {
  const { stats, isLoading, error } = useDashboardStats();

  if (isLoading) return <div>Carregando...</div>;
  if (error || !stats) return <div>Erro ao carregar dados</div>;

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-semibold mb-4">
        Debug - Pacientes por Origem
      </h3>
      <div className="space-y-2">
        {stats.pacientesPorOrigem.map((item, index) => (
          <div
            key={index}
            className="flex justify-between items-center p-2 bg-gray-50 rounded"
          >
            <span>{item.origem}</span>
            <span className="font-semibold">{item.count} pacientes</span>
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: item.color }}
            ></div>
          </div>
        ))}
      </div>
      <div className="mt-4 text-sm text-gray-600">
        Total de categorias: {stats.pacientesPorOrigem.length}
      </div>
    </div>
  );
}
