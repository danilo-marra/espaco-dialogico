import React, { useState, useMemo } from "react";
import { useOptimizedDashboardFinanceiro } from "../../hooks/useOptimizedDashboardFinanceiro";
import { useDashboardStats } from "../../hooks/useDashboardStats";
import { LazyChart } from "./LazyChart";
import { DashboardSkeleton, StatCardSkeleton } from "./DashboardSkeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../src/components/ui/card";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Activity,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseAPIDate } from "../../utils/dateUtils";
import axiosInstance from "../../utils/api";

// Componente de indicador de performance aprimorado
function PerformanceIndicator({ responseTime, dataSource, className = "" }) {
  if (!responseTime) return null;

  const time = parseInt(responseTime, 10);
  const getColor = (t) => {
    if (t < 300) return "text-green-600";
    if (t < 800) return "text-yellow-600";
    return "text-red-600";
  };

  const Icon = time < 500 ? CheckCircle : AlertCircle;
  const sourceText = dataSource === "cache" ? "cache" : "live";

  return (
    <div className={`text-xs flex items-center space-x-1 ${className}`}>
      <Icon className={`h-3 w-3 ${getColor(time)}`} />
      <span className="text-gray-500">
        {time}ms ({sourceText})
      </span>
    </div>
  );
}

// Componente de card de estatística otimizado
function OptimizedStatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendValue,
  isLoading,
  isPlaceholder,
}) {
  if (isLoading) {
    return <StatCardSkeleton />;
  }

  const getTrendColor = () => {
    if (trend === "up") return "text-green-600";
    if (trend === "down") return "text-red-600";
    return "text-gray-600";
  };

  const TrendIcon = trend === "up" ? TrendingUp : TrendingDown;

  return (
    <Card className={isPlaceholder ? "opacity-60" : ""}>
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

// Componente principal do dashboard otimizado
export function OptimizedDashboardCharts() {
  // Função para obter o período atual
  const getCurrentPeriod = () => {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = agora.getMonth() + 1;
    return `${ano}-${String(mes).padStart(2, "0")}`;
  };

  const [selectedPeriod, setSelectedPeriod] = useState(getCurrentPeriod);

  // Usar hooks otimizados
  const {
    data: financeiroData,
    isLoading: loadingFinanceiro,
    error: errorFinanceiro,
    mutate: mutateFinanceiro,
    isValidating: isValidatingFinanceiro,
  } = useOptimizedDashboardFinanceiro(selectedPeriod);

  const {
    stats,
    isLoading: loadingStats,
    error: errorStats,
  } = useDashboardStats();

  const resumoFinanceiro = financeiroData?.resumo;
  const performance = {
    responseTime: financeiroData?.responseTime,
    dataSource: financeiroData?.dataSource,
  };

  const hasFinanceiroData = !!resumoFinanceiro && resumoFinanceiro.periodo;
  const isFinanceiroPlaceholder =
    !hasFinanceiroData || financeiroData?.isPlaceholder;

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Limpa o cache do backend primeiro
      await axiosInstance.post(
        "/dashboard/financeiro-otimizado?clearCache=true",
      );
      // Revalida os dados no frontend
      await mutateFinanceiro();
    } catch (error) {
      console.error("Erro ao atualizar o dashboard:", error);
      // Adicionar feedback de erro para o usuário aqui, se necessário
    } finally {
      setIsRefreshing(false);
    }
  };

  // Navegação de períodos
  const handlePeriodChange = (direction) => {
    const [ano, mes] = selectedPeriod.split("-");
    const data = new Date(parseInt(ano), parseInt(mes) - 1, 1);

    if (direction === "prev") {
      data.setMonth(data.getMonth() - 1);
    } else {
      data.setMonth(data.getMonth() + 1);
    }

    const novoPeriodo = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
    setSelectedPeriod(novoPeriodo);
  };

  // Preparar dados para os gráficos
  const dadosMesAtual = useMemo(() => {
    return resumoFinanceiro
      ? [
          {
            mes: format(parseAPIDate(`${selectedPeriod}-01`), "MMMM yyyy", {
              locale: ptBR,
            }),
            faturamento:
              (resumoFinanceiro.receitaSessoes || 0) +
              (resumoFinanceiro.entradasManuais || 0),
            despesas:
              (resumoFinanceiro.repasseTerapeutas || 0) +
              (resumoFinanceiro.saidasManuais || 0),
            lucro: resumoFinanceiro.saldoFinal || 0,
          },
        ]
      : [];
  }, [resumoFinanceiro, selectedPeriod]);

  const statusData =
    stats?.agendamentosPorStatus?.map((item) => ({
      name: item.status,
      value: item.count,
      color: item.color,
    })) || [];

  // Loading states
  const isLoadingAny = loadingFinanceiro || loadingStats;
  const hasErrors = errorFinanceiro || errorStats;

  if (isLoadingAny && !hasFinanceiroData && !stats) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-6 text-azul">
            Dashboard Financeiro
          </h2>
          <p className="text-gray-600">Visão geral do desempenho financeiro</p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Navegação de período */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePeriodChange("prev")}
              className="p-2 rounded-md border hover:bg-gray-50"
              disabled={isRefreshing}
            >
              ←
            </button>
            <span className="text-sm font-medium min-w-[100px] text-center">
              {format(parseAPIDate(`${selectedPeriod}-01`), "MMMM yyyy", {
                locale: ptBR,
              })}
            </span>
            <button
              onClick={() => handlePeriodChange("next")}
              className="p-2 rounded-md border hover:bg-gray-50"
              disabled={isRefreshing}
            >
              →
            </button>
          </div>

          {/* Botão de refresh */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Indicadores de performance e estado */}
      {(performance.responseTime || isValidatingFinanceiro) && (
        <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 p-2 rounded">
          <PerformanceIndicator
            responseTime={performance.responseTime}
            dataSource={performance.dataSource}
          />
          {isValidatingFinanceiro && !isRefreshing && (
            <span className="flex items-center space-x-1">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>Validando...</span>
            </span>
          )}
        </div>
      )}

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <OptimizedStatCard
          title="Receita Total"
          value={
            resumoFinanceiro
              ? `R$ ${((resumoFinanceiro.receitaSessoes || 0) + (resumoFinanceiro.entradasManuais || 0)).toLocaleString()}`
              : "R$ 0"
          }
          description="Sessões pagas + entradas manuais"
          icon={DollarSign}
          trend="up"
          trendValue={5.2}
          isLoading={loadingFinanceiro}
          isPlaceholder={isFinanceiroPlaceholder}
        />

        <OptimizedStatCard
          title="Despesas"
          value={
            resumoFinanceiro
              ? `R$ ${((resumoFinanceiro.repasseTerapeutas || 0) + (resumoFinanceiro.saidasManuais || 0)).toLocaleString()}`
              : "R$ 0"
          }
          description="Repasses + saídas manuais"
          icon={Activity}
          trend="down"
          trendValue={-2.1}
          isLoading={loadingFinanceiro}
          isPlaceholder={isFinanceiroPlaceholder}
        />

        <OptimizedStatCard
          title="Lucro Líquido"
          value={
            resumoFinanceiro
              ? `R$ ${resumoFinanceiro.saldoFinal.toLocaleString()}`
              : "R$ 0"
          }
          description="Receita - Despesas"
          icon={TrendingUp}
          trend="up"
          trendValue={8.7}
          isLoading={loadingFinanceiro}
          isPlaceholder={isFinanceiroPlaceholder}
        />

        <OptimizedStatCard
          title="Sessões"
          value={resumoFinanceiro ? resumoFinanceiro.quantidadeSessoes : 0}
          description="Sessões realizadas no período"
          icon={Calendar}
          trend="up"
          trendValue={3.1}
          isLoading={loadingFinanceiro}
          isPlaceholder={isFinanceiroPlaceholder}
        />
      </div>

      {/* Gráficos principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de faturamento do mês */}
        <LazyChart
          type="bar"
          data={dadosMesAtual}
          title="Faturamento × Despesas × Lucro"
          description="Comparativo financeiro do mês selecionado"
          eager={true}
        >
          <Card>
            <CardHeader>
              <CardTitle>Faturamento × Despesas × Lucro</CardTitle>
              <p className="text-sm text-gray-600">
                Comparativo financeiro do mês selecionado
              </p>
            </CardHeader>
            <CardContent>
              {loadingFinanceiro ? (
                <div className="flex items-center justify-center h-[300px]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Carregando dados...</p>
                  </div>
                </div>
              ) : dadosMesAtual.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dadosMesAtual}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => `R$ ${value.toLocaleString()}`}
                    />
                    <Legend />
                    <Bar
                      dataKey="faturamento"
                      fill="#10b981"
                      name="Faturamento"
                      stackId="a"
                    />
                    <Bar
                      dataKey="despesas"
                      fill="#ef4444"
                      name="Despesas"
                      stackId="b"
                    />
                    <Bar
                      dataKey="lucro"
                      fill="#3b82f6"
                      name="Lucro"
                      stackId="c"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px]">
                  <div className="text-center">
                    <p className="text-gray-500">Nenhum dado disponível</p>
                    <p className="text-sm text-gray-400">
                      Dados financeiros serão exibidos aqui
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </LazyChart>

        {/* Gráfico de status dos agendamentos */}
        <LazyChart
          type="pie"
          data={statusData}
          title="Status dos Agendamentos"
          description="Distribuição dos agendamentos por status"
        >
          <Card>
            <CardHeader>
              <CardTitle>Status dos Agendamentos</CardTitle>
              <p className="text-sm text-gray-600">
                Distribuição dos agendamentos por status
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </LazyChart>
      </div>

      {/* Mensagens de erro */}
      {hasErrors && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Erro ao carregar alguns dados
              </h3>
              <p className="text-sm text-red-700">
                Alguns gráficos podem não estar atualizados. Tente atualizar a
                página.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
