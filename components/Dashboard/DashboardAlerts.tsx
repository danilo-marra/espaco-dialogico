import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../src/components/ui/card";
import { useDashboardStats } from "../../hooks/useDashboardStats";
import { AlertTriangle, Info, CheckCircle, XCircle, Clock } from "lucide-react";

interface Alert {
  type: "warning" | "info" | "success" | "error";
  title: string;
  message: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

export function DashboardAlerts() {
  const { stats, isLoading } = useDashboardStats();

  if (isLoading || !stats) {
    return null;
  }

  const generateAlerts = (): Alert[] => {
    const alerts: Alert[] = [];

    // Alerta para agendamentos cancelados
    const cancelados =
      stats.agendamentosPorStatus.find((s) => s.status === "Cancelado")
        ?.count || 0;
    if (cancelados > 0) {
      alerts.push({
        type: "warning",
        title: "Agendamentos Cancelados",
        message: `Você tem ${cancelados} agendamento(s) cancelado(s) que podem precisar de atenção.`,
        icon: AlertTriangle,
        color: "text-yellow-700",
        bgColor: "bg-yellow-50 border-yellow-200",
      });
    }

    // Alerta para sessões com pagamento pendente
    const pagamentoPendente =
      stats.sessoesPorStatus.find((s) => s.status === "Pagamento Pendente")
        ?.count || 0;
    if (pagamentoPendente > 0) {
      alerts.push({
        type: "warning",
        title: "Pagamentos Pendentes",
        message: `${pagamentoPendente} sessão(ões) com pagamento pendente. Considere fazer o acompanhamento.`,
        icon: Clock,
        color: "text-orange-700",
        bgColor: "bg-orange-50 border-orange-200",
      });
    }

    // Alerta para crescimento negativo
    if (stats.crescimentoMensal.receita < -10) {
      alerts.push({
        type: "error",
        title: "Queda na Receita",
        message: `A receita teve uma queda de ${Math.abs(stats.crescimentoMensal.receita).toFixed(1)}% neste mês. Analise os fatores que podem estar influenciando.`,
        icon: XCircle,
        color: "text-red-700",
        bgColor: "bg-red-50 border-red-200",
      });
    }

    // Alerta para crescimento positivo
    if (stats.crescimentoMensal.receita > 20) {
      alerts.push({
        type: "success",
        title: "Excelente Crescimento!",
        message: `Parabéns! A receita cresceu ${stats.crescimentoMensal.receita.toFixed(1)}% neste mês.`,
        icon: CheckCircle,
        color: "text-green-700",
        bgColor: "bg-green-50 border-green-200",
      });
    }

    // Alerta informativo sobre sessões por terapeuta
    const sessoesMedias = stats.totalSessoes / (stats.totalTerapeutas || 1);
    if (sessoesMedias < 10) {
      alerts.push({
        type: "info",
        title: "Distribuição de Sessões",
        message: `A média é de ${sessoesMedias.toFixed(1)} sessões por terapeuta. Considere verificar a distribuição de carga de trabalho.`,
        icon: Info,
        color: "text-blue-700",
        bgColor: "bg-blue-50 border-blue-200",
      });
    }

    // Alerta para saldo negativo
    if (stats.saldoTotal < 0) {
      alerts.push({
        type: "error",
        title: "Saldo Negativo",
        message: `O saldo atual é negativo. Revise os gastos e considere medidas para melhorar o fluxo de caixa.`,
        icon: XCircle,
        color: "text-red-700",
        bgColor: "bg-red-50 border-red-200",
      });
    }

    return alerts;
  };

  const alerts = generateAlerts();

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-azul flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
            Tudo em Ordem!
          </CardTitle>
          <CardDescription>
            Não há alertas importantes no momento. Seu negócio está funcionando
            bem.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg text-azul">
          Alertas e Notificações
        </CardTitle>
        <CardDescription>
          Informações importantes que merecem sua atenção
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.map((alert, index) => (
          <div key={index} className={`p-4 rounded-lg border ${alert.bgColor}`}>
            <div className="flex items-start space-x-3">
              <alert.icon className={`h-5 w-5 mt-0.5 ${alert.color}`} />
              <div className="flex-1">
                <h4 className={`font-medium ${alert.color}`}>{alert.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
