import React from "react";
import {
  Card,
  CardContent,
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
    // Garantir que o valor seja um número válido
    const numValue = Number(value);
    if (isNaN(numValue) || !isFinite(numValue) || numValue === 0) {
      return "R$ 0,00";
    }

    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numValue);
  };

  const calculateAverage = () => {
    // Garantir que os valores sejam números válidos
    const totalSessoes = Number(stats.totalSessoes) || 0;
    const totalTerapeutas = Math.max(Number(stats.totalTerapeutas) || 1, 1);
    const totalPacientes = Math.max(Number(stats.totalPacientes) || 1, 1);

    const avgSessoesPerTerapeuta = totalSessoes / totalTerapeutas;
    const avgSessoesPerPaciente = totalSessoes / totalPacientes;

    // Usar o valor médio por sessão já calculado no hook
    const avgReceitaPerSessao = Number(stats.valorMedioPorSessao) || 0;

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
    </div>
  );
}
