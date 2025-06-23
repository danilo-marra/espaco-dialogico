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
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  Target,
} from "lucide-react";

export function DashboardSummary() {
  const { stats, isLoading } = useDashboardStats();

  if (isLoading || !stats) {
    return null;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const calculateAverage = () => {
    const avgSessoesPerTerapeuta =
      stats.totalSessoes / (stats.totalTerapeutas || 1);
    const avgSessoesPerPaciente =
      stats.totalSessoes / (stats.totalPacientes || 1);
    const avgReceitaPerSessao = stats.receita / (stats.totalSessoes || 1);

    return {
      avgSessoesPerTerapeuta: avgSessoesPerTerapeuta.toFixed(1),
      avgSessoesPerPaciente: avgSessoesPerPaciente.toFixed(1),
      avgReceitaPerSessao: avgReceitaPerSessao,
    };
  };

  const averages = calculateAverage();

  const summaryCards = [
    {
      title: "Terapeutas Ativos",
      value: stats.totalTerapeutas,
      description: "Profissionais cadastrados",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Sessões por Terapeuta",
      value: averages.avgSessoesPerTerapeuta,
      description: "Média de sessões",
      icon: Target,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Sessões por Paciente",
      value: averages.avgSessoesPerPaciente,
      description: "Média de atendimentos",
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Valor Médio por Sessão",
      value: formatCurrency(averages.avgReceitaPerSessao),
      description: "Receita média",
      icon: DollarSign,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      title: "Taxa de Confirmação",
      value: `${(((stats.agendamentosPorStatus.find((s) => s.status === "Confirmado")?.count || 0) / (stats.totalAgendamentos || 1)) * 100).toFixed(1)}%`,
      description: "Agendamentos confirmados",
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Sessões em Andamento",
      value: stats.sessoesPorStatus
        .filter((s) => s.status !== "Nota Fiscal Enviada")
        .reduce((acc, s) => acc + s.count, 0),
      description: "Pendentes ou em processo",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {summaryCards.map((card, index) => (
          <Card
            key={index}
            className="hover:shadow-md transition-shadow duration-200"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {card.value}
              </div>
              <p className="text-xs text-gray-500">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Card de insights rápidos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-azul">Insights Rápidos</CardTitle>
          <CardDescription>
            Principais métricas e tendências do seu negócio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg bg-gray-50">
              <h4 className="font-medium text-gray-900 mb-2">
                Status Financeiro
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Receita Total:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(stats.receita)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Gastos Total:</span>
                  <span className="font-medium text-red-600">
                    {formatCurrency(stats.gastos)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600">Saldo:</span>
                  <span
                    className={`font-bold ${stats.saldoTotal >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {formatCurrency(stats.saldoTotal)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-gray-50">
              <h4 className="font-medium text-gray-900 mb-2">
                Crescimento Mensal
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Pacientes:</span>
                  <span
                    className={`font-medium ${stats.crescimentoMensal.pacientes >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {stats.crescimentoMensal.pacientes >= 0 ? "+" : ""}
                    {stats.crescimentoMensal.pacientes.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sessões:</span>
                  <span
                    className={`font-medium ${stats.crescimentoMensal.sessoes >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {stats.crescimentoMensal.sessoes >= 0 ? "+" : ""}
                    {stats.crescimentoMensal.sessoes.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Receita:</span>
                  <span
                    className={`font-medium ${stats.crescimentoMensal.receita >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {stats.crescimentoMensal.receita >= 0 ? "+" : ""}
                    {stats.crescimentoMensal.receita.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
