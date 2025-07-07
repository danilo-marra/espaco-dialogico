import React, { useState } from "react";
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
import {
  useDashboardFinanceiro,
  useDashboardFinanceiroHistorico,
} from "../../hooks/useDashboardFinanceiro";
import { useFinanceiroSync } from "../../hooks/useFinanceiroSync";
import { DashboardSkeleton } from "./DashboardSkeleton";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  DollarSign,
  Activity,
  UserCheck,
  CheckCircle,
  Target,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { getNotaFiscalStatusColor } from "../../utils/statusColors";
import { format, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Hook para sincronização automática
  const { invalidateFinanceiro } = useFinanceiroSync();

  // Formatar período para o endpoint (YYYY-MM)
  const periodoSelecionado = format(selectedMonth, "yyyy-MM");

  // Buscar dados financeiros do período selecionado
  const {
    resumoFinanceiro,
    isLoading: loadingFinanceiro,
    isValidating: validatingFinanceiro,
    error: errorFinanceiro,
    mutate: mutateFinanceiro,
  } = useDashboardFinanceiro(periodoSelecionado);

  // Buscar histórico financeiro dos últimos 6 meses
  const {
    historicoFinanceiro,
    isLoading: loadingHistorico,
    isValidating: validatingHistorico,
    error: errorHistorico,
    mutate: mutateHistorico,
  } = useDashboardFinanceiroHistorico();

  // Loading inicial - apenas na primeira carga
  const isInitialLoading = isLoading && !stats;
  const isFinanceiroInitialLoading = loadingFinanceiro && !resumoFinanceiro;
  const isHistoricoInitialLoading = loadingHistorico && !historicoFinanceiro;

  if (
    isInitialLoading ||
    isFinanceiroInitialLoading ||
    isHistoricoInitialLoading
  ) {
    return <DashboardSkeleton />;
  }

  if (error || !stats || errorFinanceiro || errorHistorico) {
    return (
      <div className="text-center text-red-600 p-8">
        <p>Erro ao carregar as estatísticas do dashboard.</p>
        {errorFinanceiro && (
          <p>Erro nos dados financeiros: {errorFinanceiro.message}</p>
        )}
        {errorHistorico && <p>Erro no histórico: {errorHistorico.message}</p>}
      </div>
    );
  }

  // Função para calcular valor médio por sessão de forma segura
  const getValorMedioPorSessao = () => {
    // Priorizar dados do resumo financeiro se disponível
    if (resumoFinanceiro && resumoFinanceiro.quantidadeSessoes > 0) {
      const valorMedio =
        resumoFinanceiro.totalEntradas / resumoFinanceiro.quantidadeSessoes;
      return isNaN(valorMedio) || !isFinite(valorMedio) ? 0 : valorMedio;
    }

    // Fallback para dados do stats
    const receita = stats.receita || 0;
    const sessoes = stats.totalSessoes || 0;

    if (sessoes === 0) return 0;

    const valorMedio = receita / sessoes;
    return isNaN(valorMedio) || !isFinite(valorMedio) ? 0 : valorMedio;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Função para navegar entre meses com transição suave
  const handleMonthChange = async (direction: "prev" | "next") => {
    // Não permitir mudanças durante transições ou validação
    if (isTransitioning || validatingFinanceiro) return;

    setIsTransitioning(true);

    try {
      if (direction === "prev") {
        setSelectedMonth(subMonths(selectedMonth, 1));
      } else {
        setSelectedMonth(addMonths(selectedMonth, 1));
      }

      // Aguardar um ciclo de render para garantir transição suave
      await new Promise((resolve) => setTimeout(resolve, 100));
    } finally {
      // Aguardar dados carregarem antes de finalizar transição
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  // Função para atualizar dados manualmente
  const refreshData = async () => {
    if (isTransitioning || validatingFinanceiro || validatingHistorico) return;

    setIsTransitioning(true);
    try {
      await Promise.all([
        mutateFinanceiro(),
        mutateHistorico(),
        invalidateFinanceiro(),
      ]);

      // Pequeno delay para feedback visual
      await new Promise((resolve) => setTimeout(resolve, 500));
    } finally {
      setIsTransitioning(false);
    }
  };

  // Dados financeiros do mês selecionado
  const monthlyFinancial = resumoFinanceiro
    ? {
        mes: format(selectedMonth, "MMM yyyy", { locale: ptBR }),
        faturamento: resumoFinanceiro.totalEntradas,
        despesas: resumoFinanceiro.totalSaidas,
        lucro: resumoFinanceiro.saldoFinal,
      }
    : {
        mes: format(selectedMonth, "MMM yyyy", { locale: ptBR }),
        faturamento: 0,
        despesas: 0,
        lucro: 0,
      };

  // Dados históricos dos últimos 6 meses
  const financialData = historicoFinanceiro || [];

  // Dados mockados para Notas Fiscais - em produção viriam do hook useDashboardStats
  const notasFiscaisData = [
    {
      status: "Não Emitida",
      count: 15,
      color: getNotaFiscalStatusColor("Não Emitida"),
    },
    { status: "Emitida", count: 8, color: getNotaFiscalStatusColor("Emitida") },
    {
      status: "Enviada",
      count: 22,
      color: getNotaFiscalStatusColor("Enviada"),
    },
  ];

  // Top pacientes por pagamento - mockados
  const topPacientes = [
    { nome: "João Silva", valor: 1800 },
    { nome: "Maria Santos", valor: 1500 },
    { nome: "Pedro Costa", valor: 1200 },
    { nome: "Ana Oliveira", valor: 1000 },
    { nome: "Carlos Lima", valor: 900 },
  ];

  return (
    <div className="space-y-6">
      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Terapeutas Ativos"
          value={stats.totalTerapeutas}
          description="Terapeutas ativos no sistema"
          icon={Users}
        />
        <StatCard
          title="Sessões do Mês"
          value={stats.totalSessoes}
          description="Sessões realizadas este mês"
          icon={Calendar}
        />
        <StatCard
          title="Valor Médio/Sessão"
          value={formatCurrency(getValorMedioPorSessao())}
          description="Valor médio por sessão"
          icon={DollarSign}
        />
        <StatCard
          title="Taxa de Confirmação"
          value="92%"
          description="Taxa de confirmação de sessões"
          icon={CheckCircle}
        />
      </div>

      {/* Gráfico Principal - Faturamento x Despesas x Lucro - Tela Inteira */}
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold">
                Faturamento × Despesas × Lucro
              </CardTitle>
              <CardDescription>
                Extrato financeiro completo - Navegue pelos meses
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={refreshData}
                disabled={
                  isTransitioning ||
                  loadingFinanceiro ||
                  validatingFinanceiro ||
                  validatingHistorico
                }
                className="p-2 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Atualizar dados"
                title="Atualizar dados"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    isTransitioning ||
                    validatingFinanceiro ||
                    validatingHistorico
                      ? "animate-spin"
                      : ""
                  }`}
                />
              </button>
              <button
                onClick={() => handleMonthChange("prev")}
                disabled={isTransitioning || validatingFinanceiro}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Mês anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-lg font-semibold min-w-[120px] text-center">
                {format(selectedMonth, "MMMM yyyy", { locale: ptBR })}
                {(isTransitioning || validatingFinanceiro) && (
                  <span className="ml-2 text-sm text-gray-500 animate-pulse">
                    ...
                  </span>
                )}
              </span>
              <button
                onClick={() => handleMonthChange("next")}
                disabled={isTransitioning || validatingFinanceiro}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Próximo mês"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div
            className={`transition-all duration-500 ease-in-out ${
              isTransitioning || validatingFinanceiro
                ? "opacity-50 transform scale-[0.98]"
                : "opacity-100 transform scale-100"
            }`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Valores do mês selecionado */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700">
                  Resumo do Mês
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-blue-700 font-medium">
                      Faturamento
                    </span>
                    <span className="text-blue-800 font-bold text-lg">
                      {formatCurrency(monthlyFinancial.faturamento)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="text-red-700 font-medium">Despesas</span>
                    <span className="text-red-800 font-bold text-lg">
                      {formatCurrency(monthlyFinancial.despesas)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-green-700 font-medium">Lucro</span>
                    <span className="text-green-800 font-bold text-lg">
                      {formatCurrency(monthlyFinancial.lucro)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Gráfico de barras comparativo */}
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[monthlyFinancial]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <ChartTooltip
                      formatter={(value) => [formatCurrency(Number(value)), ""]}
                      labelFormatter={() =>
                        format(selectedMonth, "MMMM yyyy", { locale: ptBR })
                      }
                    />
                    <Bar
                      dataKey="faturamento"
                      fill="#3b82f6"
                      name="Faturamento"
                    />
                    <Bar dataKey="despesas" fill="#ef4444" name="Despesas" />
                    <Bar dataKey="lucro" fill="#10b981" name="Lucro" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico de linha histórico */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                Histórico dos Últimos 6 Meses
              </h3>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={financialData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <ChartTooltip
                      formatter={(value) => [formatCurrency(Number(value)), ""]}
                    />
                    <Line
                      type="monotone"
                      dataKey="faturamento"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      name="Faturamento"
                      dot={{ r: 6, fill: "#3b82f6" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="despesas"
                      stroke="#ef4444"
                      strokeWidth={3}
                      name="Despesas"
                      dot={{ r: 6, fill: "#ef4444" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="lucro"
                      stroke="#10b981"
                      strokeWidth={3}
                      name="Lucro"
                      dot={{ r: 6, fill: "#10b981" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos secundários em grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notas Fiscais por Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status das Notas Fiscais</CardTitle>
            <CardDescription>
              Distribuição mensal das Notas Fiscais por status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: {
                  label: "Quantidade",
                  color: "#8b5cf6",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={notasFiscaisData}
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
                    {notasFiscaisData.map((entry, index) => {
                      let color = "#gray";
                      if (entry.status === "Não Emitida") color = "#ef4444";
                      if (entry.status === "Emitida") color = "#f59e0b";
                      if (entry.status === "Enviada") color = "#10b981";
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Pie>
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value) => [value, "Notas Fiscais"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Terapeutas que mais faturaram */}
        <Card>
          <CardHeader>
            <CardTitle>Top Terapeutas - Faturamento do Mês</CardTitle>
            <CardDescription>
              Ranking dos terapeutas por faturamento mensal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                receita: {
                  label: "Faturamento",
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
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value) => [
                      formatCurrency(Number(value)),
                      "Faturamento",
                    ]}
                  />
                  <Bar dataKey="receita" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Pacientes que mais pagaram */}
        <Card>
          <CardHeader>
            <CardTitle>Top Pacientes - Pagamentos do Mês</CardTitle>
            <CardDescription>
              Pacientes que mais contribuíram financeiramente este mês
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                valor: {
                  label: "Valor Pago",
                  color: "#f59e0b",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topPacientes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="nome"
                    tick={{ fontSize: 11 }}
                    tickMargin={10}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value) => [
                      formatCurrency(Number(value)),
                      "Valor Pago",
                    ]}
                  />
                  <Bar dataKey="valor" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Evolução da Receita */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução da Receita</CardTitle>
            <CardDescription>
              Receita mensal dos últimos 6 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                receita: {
                  label: "Receita",
                  color: "#10b981",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.sessoesPorMes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="mes"
                    tick={{ fontSize: 12 }}
                    tickMargin={10}
                  />
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

      {/* Métricas adicionais solicitadas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Sessões por Terapeuta"
          value={(stats.totalSessoes / stats.totalTerapeutas).toFixed(1)}
          description="Média de sessões por terapeuta"
          icon={UserCheck}
        />
        <StatCard
          title="Sessões por Paciente"
          value={(stats.totalSessoes / stats.totalPacientes).toFixed(1)}
          description="Média de sessões por paciente"
          icon={Target}
        />
        <StatCard
          title="Sessões em Andamento"
          value={
            stats.agendamentosPorStatus.find((s) => s.status === "Confirmado")
              ?.count || 0
          }
          description="Sessões confirmadas para os próximos dias"
          icon={Activity}
        />
      </div>
    </div>
  );
}
