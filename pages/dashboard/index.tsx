import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import useAuth from "../../hooks/useAuth";
import { usePermissions } from "../../hooks/usePermissions";
import { OptimizedDashboardCharts } from "../../components/Dashboard/OptimizedDashboardCharts";
import { DashboardSummary } from "../../components/Dashboard/DashboardSummary";
import { DashboardAlerts } from "../../components/Dashboard/DashboardAlerts";
import { DashboardPendencias } from "../../components/Dashboard/DashboardPendencias";
import { DashboardPeriodSelector } from "../../components/Dashboard/DashboardPeriodSelector";
import PermissionGuard from "../../components/PermissionGuard";

export default function Dashboard() {
  const { loading } = useAuth();
  const { userRole, isLoading } = usePermissions();
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  // Redirecionar usuários comuns para a agenda
  useEffect(() => {
    if (!isLoading && (userRole === "terapeuta" || userRole === "secretaria")) {
      router.replace("/dashboard/agenda");
    }
  }, [userRole, isLoading, router]);

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-medium mb-2">Carregando...</h2>
          <div className="w-8 h-8 border-4 border-t-azul rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  // Se é usuário comum, não renderizar o conteúdo (será redirecionado)
  if (userRole === "terapeuta" || userRole === "secretaria") {
    return null;
  }

  return (
    <>
      <Head>
        <title>Dashboard - Espaço Dialógico</title>
      </Head>
      <div className="p-6">
        <div className="mb-6 flex justify-center">
          <DashboardPeriodSelector
            selectedPeriod={selectedPeriod}
            onChangePeriod={setSelectedPeriod}
          />
        </div>

        <PermissionGuard resource="sessoes">
          <div className="mb-8">
            <DashboardPendencias selectedPeriod={selectedPeriod} />
          </div>
        </PermissionGuard>

        {/* Seção de gráficos e estatísticas - apenas para admins */}
        <PermissionGuard resource="usuarios">
          <div className="mb-8">
            <OptimizedDashboardCharts selectedPeriod={selectedPeriod} />
          </div>
        </PermissionGuard>

        {/* Seção de resumo executivo */}
        <PermissionGuard resource="transacoes">
          <div className="mb-8">
            <DashboardSummary />
          </div>
        </PermissionGuard>

        {/* Seção de alertas importantes - ÚLTIMO ITEM */}
        <div className="mb-8">
          <DashboardAlerts />
        </div>
      </div>
    </>
  );
}
