import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { useDashboardStats } from "../../hooks/useDashboardStats";

export function GraficoTesteSimples() {
  const { stats, isLoading, error } = useDashboardStats();

  if (isLoading) return <div>Carregando...</div>;
  if (error || !stats) return <div>Erro ao carregar dados</div>;

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-semibold mb-4">Teste - Gráfico Simples</h3>
      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={stats.pacientesPorOrigem} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="origem" type="category" width={100} />
            <Bar dataKey="count" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4">
        <pre className="text-xs bg-gray-100 p-2 rounded">
          {JSON.stringify(stats.pacientesPorOrigem, null, 2)}
        </pre>
      </div>
    </div>
  );
}
