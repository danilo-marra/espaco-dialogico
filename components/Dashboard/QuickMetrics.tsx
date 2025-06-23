import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../src/components/ui/card";
import { useDashboardStats } from "../../hooks/useDashboardStats";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";

export function QuickMetrics() {
  const { stats, isLoading } = useDashboardStats();

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
            <div className="h-16 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  // Preparar dados para mini gráficos
  const statusData = stats.agendamentosPorStatus.slice(0, 3);
  const recentSessions = stats.sessoesPorMes.slice(-3);
  const topTerapeutas = stats.sessoesPorTerapeuta.slice(0, 3);
  const origemData = stats.pacientesPorOrigem.slice(0, 3);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Status de Agendamentos */}
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">
            Status dos Agendamentos
          </CardTitle>
          <CardDescription className="text-xs">
            Distribuição atual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-16 mb-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={10}
                  outerRadius={25}
                  dataKey="count"
                  nameKey="status"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-2xl font-bold text-center">
            {stats.totalAgendamentos}
          </div>
          <p className="text-xs text-gray-500 text-center">
            Total de agendamentos
          </p>
        </CardContent>
      </Card>

      {/* Evolução de Sessões */}
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">
            Sessões Recentes
          </CardTitle>
          <CardDescription className="text-xs">Últimos 3 meses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-16 mb-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={recentSessions}>
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="text-2xl font-bold text-center">
            {recentSessions[recentSessions.length - 1]?.count || 0}
          </div>
          <p className="text-xs text-gray-500 text-center">
            Sessões no último mês
          </p>
        </CardContent>
      </Card>

      {/* Top Terapeutas */}
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">
            Top Terapeutas
          </CardTitle>
          <CardDescription className="text-xs">
            Por número de sessões
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-16 mb-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topTerapeutas}>
                <Bar dataKey="count" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-2xl font-bold text-center">
            {topTerapeutas.length}
          </div>
          <p className="text-xs text-gray-500 text-center">Terapeutas ativos</p>
        </CardContent>
      </Card>

      {/* Origem dos Pacientes */}
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">
            Origem de Pacientes
          </CardTitle>
          <CardDescription className="text-xs">
            Principais fontes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-16 mb-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={origemData} layout="horizontal">
                <XAxis type="number" hide />
                <YAxis dataKey="origem" type="category" hide />
                <Bar dataKey="count" fill="#10b981" radius={[0, 2, 2, 0]}>
                  {origemData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-2xl font-bold text-center">
            {stats.totalPacientes}
          </div>
          <p className="text-xs text-gray-500 text-center">
            Total de pacientes
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
