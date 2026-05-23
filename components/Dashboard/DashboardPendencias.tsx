import React from "react";
import Link from "next/link";
import { AlertTriangle, Receipt, CalendarClock, HandCoins } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDashboardPendencias } from "../../hooks/useDashboardPendencias";
import { parseAPIDate } from "../../utils/dateUtils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../src/components/ui/card";

interface DashboardPendenciasProps {
  selectedPeriod: string;
}

const LIST_LIMIT = 5;

const formatDate = (dateValue?: string | null) => {
  if (!dateValue) return "Sem data";
  return format(parseAPIDate(String(dateValue)), "dd/MM/yyyy", {
    locale: ptBR,
  });
};

export function DashboardPendencias({
  selectedPeriod,
}: DashboardPendenciasProps) {
  const { data, isLoading, isError } = useDashboardPendencias(selectedPeriod);

  const sections = data
    ? [
        {
          key: "cobranca",
          title: "Pacientes a cobrar",
          total: data.resumo.pacientesACobrar,
          icon: AlertTriangle,
          color: "text-amber-700",
          bgColor: "bg-amber-50 border-amber-200",
          href: `/dashboard/sessoes?status=${encodeURIComponent("Pagamento Pendente")}&periodo=${selectedPeriod}`,
          items: data.pacientesACobrar.map((item) => ({
            id: item.id,
            nome: item.nome,
            descricao: `${item.totalSessoes || 0} sessão(ões) • ${item.terapeutaNome}`,
            data: item.dataReferencia,
          })),
          emptyMessage:
            "Nenhum paciente pendente de cobrança no mês selecionado.",
        },
        {
          key: "nota-fiscal",
          title: "Pendências de nota fiscal",
          total: data.resumo.notasFiscaisPendentes,
          icon: Receipt,
          color: "text-blue-700",
          bgColor: "bg-blue-50 border-blue-200",
          href: `/dashboard/notas-fiscais?status=${encodeURIComponent("Pendente")}&periodo=${selectedPeriod}`,
          items: data.notasFiscaisPendentes.map((item) => ({
            id: item.id,
            nome: item.nome,
            descricao: `${item.totalSessoes || 0} sessão(ões) • ${item.terapeutaNome}`,
            data: item.dataReferencia,
          })),
          emptyMessage: "Nenhuma pendência de nota fiscal neste mês.",
        },
        {
          key: "marcacao",
          title: "Pendências de marcação",
          total: data.resumo.marcacoesPendentes,
          icon: CalendarClock,
          color: "text-purple-700",
          bgColor: "bg-purple-50 border-purple-200",
          href: `/dashboard/agenda?pendencia=marcacao&periodo=${selectedPeriod}`,
          items: data.marcacoesPendentes.map((item) => ({
            id: item.id,
            nome: item.nome,
            descricao: item.terapeutaNome || "Sem terapeuta",
            data: item.dataReferencia,
          })),
          emptyMessage: "Todos os pacientes têm marcação no período.",
        },
        {
          key: "repasse",
          title: "Pendências de repasse",
          total: data.resumo.repassesPendentes,
          icon: HandCoins,
          color: "text-rose-700",
          bgColor: "bg-rose-50 border-rose-200",
          href: `/dashboard/sessoes?repasse=${encodeURIComponent("Repasse Pendente")}&periodo=${selectedPeriod}`,
          items: data.repassesPendentes.map((item) => ({
            id: item.id,
            nome: item.nome,
            descricao: `${item.totalSessoes || 0} sessão(ões)`,
            data:
              typeof item.totalRepasse === "number"
                ? new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(item.totalRepasse)
                : null,
          })),
          emptyMessage: "Não há repasses pendentes no período.",
        },
      ]
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl text-azul">Pendências do mês</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 animate-pulse bg-gray-50 h-36"
              />
            ))}
          </div>
        )}

        {!isLoading && isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 text-sm">
            Não foi possível carregar as pendências do período.
          </div>
        )}

        {!isLoading && !isError && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {sections.map((section) => (
              <div
                key={section.key}
                className={`border rounded-lg p-4 ${section.bgColor}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <section.icon className={`h-5 w-5 ${section.color}`} />
                    <h3 className={`font-semibold ${section.color}`}>
                      {section.title}
                    </h3>
                  </div>
                  <span className="text-xl font-bold text-gray-900">
                    {section.total}
                  </span>
                </div>

                {section.items.length === 0 ? (
                  <p className="text-sm text-gray-600 mb-3">
                    {section.emptyMessage}
                  </p>
                ) : (
                  <ul className="space-y-2 mb-3">
                    {section.items.slice(0, LIST_LIMIT).map((item) => (
                      <li key={`${section.key}-${item.id}`} className="text-sm">
                        <p className="font-medium text-gray-900">{item.nome}</p>
                        <p className="text-gray-600">{item.descricao}</p>
                        {item.data && (
                          <p className="text-xs text-gray-500">
                            {section.key === "repasse"
                              ? item.data
                              : `Ref.: ${formatDate(item.data)}`}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                <Link
                  href={section.href}
                  className="text-sm font-medium text-blue-700 hover:underline"
                >
                  Ver todos
                </Link>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
