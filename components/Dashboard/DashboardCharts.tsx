import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../src/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../../src/components/ui/chart";
import { useDashboardStats } from "../../hooks/useDashboardStats";
import { DashboardSkeleton } from "./DashboardSkeleton";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  DollarSign,
  Activity,
} from "lucide-react";

// Componente de card de estatística com ícone
function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendValue,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  trendValue?: number;
}) {
  const getTrendColor = () => {
    if (trend === "up") return "text-green-600";
    if (trend === "down") return "text-red-600";
    return "text-gray-600";
  };

  const TrendIcon = trend === "up" ? TrendingUp : TrendingDown;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">
          {description}
          {trendValue !== undefined && (
            <span className={`ml-1 flex items-center ${getTrendColor()}`}>
              <TrendIcon className="h-3 w-3 mr-1" />
              {Math.abs(trendValue).toFixed(1)}%
            </span>
          )}
        </p>
      </CardContent>
    </Card>
  );
}

// Componente principal do dashboard com gráficos
export function DashboardCharts() {
  const { stats, isLoading, error } = useDashboardStats();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error || !stats) {
    return (
      <div className="text-center text-red-600 p-8">
        <p>Erro ao carregar as estatísticas do dashboard.</p>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Cards de estatísticas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Pacientes"
          value={stats.totalPacientes}
          description="Pacientes cadastrados"
          icon={Users}
          trend={
            stats.crescimentoMensal.pacientes > 0
              ? "up"
              : stats.crescimentoMensal.pacientes < 0
                ? "down"
                : "neutral"
          }
          trendValue={stats.crescimentoMensal.pacientes}
        />
        <StatCard
          title="Total de Sessões"
          value={stats.totalSessoes}
          description="Sessões realizadas"
          icon={Calendar}
          trend={
            stats.crescimentoMensal.sessoes > 0
              ? "up"
              : stats.crescimentoMensal.sessoes < 0
                ? "down"
                : "neutral"
          }
          trendValue={stats.crescimentoMensal.sessoes}
        />
        <StatCard
          title="Receita Total"
          value={formatCurrency(stats.receita)}
          description="Receita acumulada"
          icon={DollarSign}
          trend={
            stats.crescimentoMensal.receita > 0
              ? "up"
              : stats.crescimentoMensal.receita < 0
                ? "down"
                : "neutral"
          }
          trendValue={stats.crescimentoMensal.receita}
        />
        <StatCard
          title="Saldo Atual"
          value={formatCurrency(stats.saldoTotal)}
          description="Receita - Gastos"
          icon={Activity}
          trend={
            stats.saldoTotal > 0
              ? "up"
              : stats.saldoTotal < 0
                ? "down"
                : "neutral"
          }
        />
      </div>

      {/* Gráficos principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Sessões por Mês */}
        <Card>
          <CardHeader>
            <CardTitle>Sessões por Mês</CardTitle>
            <CardDescription>
              Evolução das sessões nos últimos 6 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: {
                  label: "Sessões",
                  color: "hsl(var(--chart-1))",
                },
                receita: {
                  label: "Receita",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.sessoesPorMes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="mes"
                    tick={{ fontSize: 12 }}
                    tickMargin={10}
                  />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 12 }}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value, name) => [
                      name === "receita"
                        ? formatCurrency(Number(value))
                        : value,
                      name === "count" ? "Sessões" : "Receita",
                    ]}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="count"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        {/* Gráfico de Status de Agendamentos */}
        <Card>
          <CardHeader>
            <CardTitle>Status dos Agendamentos</CardTitle>
            <CardDescription>
              Distribuição dos agendamentos por status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                Confirmado: {
                  label: "Confirmado",
                  color: "#10b981",
                },
                Remarcado: {
                  label: "Remarcado",
                  color: "#f59e0b",
                },
                Cancelado: {
                  label: "Cancelado",
                  color: "#ef4444",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.agendamentosPorStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, count, percent }) =>
                      `${status}: ${count} (${(percent * 100).toFixed(0)}%)`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="status"
                  >
                    {stats.agendamentosPorStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>{" "}
        {/* Gráfico de Pacientes por Origem */}
        <Card>
          <CardHeader>
            <CardTitle>Pacientes por Origem</CardTitle>
            <CardDescription>
              Como os pacientes chegaram ao consultório
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.pacientesPorOrigem}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="origem"
                    tick={{ fontSize: 12, fill: "#374151" }}
                    axisLine={{ stroke: "#d1d5db" }}
                    tickLine={{ stroke: "#d1d5db" }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#374151" }}
                    axisLine={{ stroke: "#d1d5db" }}
                    tickLine={{ stroke: "#d1d5db" }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {stats.pacientesPorOrigem.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Legenda personalizada */}
            <div className="flex flex-wrap gap-4 mt-4 justify-center">
              {stats.pacientesPorOrigem.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-600">
                    {item.origem} ({item.count})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        {/* Gráfico de Sessões por Terapeuta */}
        <Card>
          <CardHeader>
            <CardTitle>Sessões por Terapeuta</CardTitle>
            <CardDescription>
              Ranking dos terapeutas por número de sessões
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: {
                  label: "Sessões",
                  color: "#8b5cf6",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.sessoesPorTerapeuta.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="nome"
                    tick={{ fontSize: 11 }}
                    tickMargin={10}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 12 }} />{" "}
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value) => [value, "Sessões"]}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de linha para receita mensal */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução da Receita</CardTitle>
          <CardDescription>Receita mensal dos últimos 6 meses</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              receita: {
                label: "Receita",
                color: "#10b981",
              },
            }}
            className="h-[400px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.sessoesPorMes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} tickMargin={10} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  formatter={(value) => [
                    formatCurrency(Number(value)),
                    "Receita",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="receita"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 6, fill: "#10b981" }}
                  activeDot={{ r: 8, fill: "#10b981" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
