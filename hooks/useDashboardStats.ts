import { useMemo } from "react";
import { useFetchTerapeutas } from "./useFetchTerapeutas";
import { useFetchPacientes } from "./useFetchPacientes";
import { useFetchAgendamentos } from "./useFetchAgendamentos";
import { useFetchSessoes } from "./useFetchSessoes";
import { useFetchTransacoes } from "./useFetchTransacoes";

export interface DashboardStats {
  totalTerapeutas: number;
  totalPacientes: number;
  totalAgendamentos: number;
  totalSessoes: number;
  totalTransacoes: number;

  // Estatísticas por status
  agendamentosPorStatus: Array<{
    status: string;
    count: number;
    color: string;
  }>;
  sessoesPorStatus: Array<{ status: string; count: number; color: string }>;

  // Estatísticas financeiras
  receita: number;
  gastos: number;
  saldoTotal: number;

  // Campos específicos para o valor médio por sessão
  receitaTotalSessoes: number; // Receita apenas de sessões pagas
  sessoesComValor: number; // Quantidade de sessões pagas com valor válido
  valorMedioPorSessao: number; // Valor médio baseado apenas em sessões pagas

  // Estatísticas por período (últimos 6 meses)
  sessoesPorMes: Array<{ mes: string; count: number; receita: number }>;
  pacientesPorOrigem: Array<{ origem: string; count: number; color: string }>;

  // Estatísticas por terapeuta
  sessoesPorTerapeuta: Array<{ nome: string; count: number; receita: number }>;

  // Estatísticas de crescimento
  crescimentoMensal: {
    pacientes: number;
    sessoes: number;
    receita: number;
  };
}

export function useDashboardStats(): {
  stats: DashboardStats | null;
  isLoading: boolean;
  error: any;
} {
  const {
    terapeutas,
    isLoading: loadingTerapeutas,
    isError: errorTerapeutas,
  } = useFetchTerapeutas();
  const {
    pacientes,
    isLoading: loadingPacientes,
    isError: errorPacientes,
  } = useFetchPacientes();
  const {
    agendamentos,
    isLoading: loadingAgendamentos,
    isError: errorAgendamentos,
  } = useFetchAgendamentos();
  const {
    sessoes,
    isLoading: loadingSessoes,
    isError: errorSessoes,
  } = useFetchSessoes();
  const {
    transacoes,
    isLoading: loadingTransacoes,
    isError: errorTransacoes,
  } = useFetchTransacoes();

  const isLoading =
    loadingTerapeutas ||
    loadingPacientes ||
    loadingAgendamentos ||
    loadingSessoes ||
    loadingTransacoes;
  const error =
    errorTerapeutas ||
    errorPacientes ||
    errorAgendamentos ||
    errorSessoes ||
    errorTransacoes;
  const stats = useMemo(() => {
    // Verificação mais robusta - deve ter dados válidos (arrays) para prosseguir
    if (
      !Array.isArray(terapeutas) ||
      !Array.isArray(pacientes) ||
      !Array.isArray(agendamentos) ||
      !Array.isArray(sessoes) ||
      !Array.isArray(transacoes)
    ) {
      return null;
    }

    // Cores para os gráficos
    const statusColors = {
      Confirmado: "#10b981", // green-500
      Cancelado: "#ef4444", // red-500
      "Pagamento Pendente": "#f59e0b", // yellow-500
      "Pagamento Realizado": "#10b981", // green-500
      "Nota Fiscal Emitida": "#3b82f6", // blue-500
      "Nota Fiscal Enviada": "#8b5cf6", // purple-500
    };

    const origemColors = {
      Indicação: "#10b981",
      Instagram: "#e11d48",
      "Busca no Google": "#3b82f6",
      Outros: "#6b7280",
    };

    // Estatísticas básicas
    const totalTerapeutas = terapeutas.length;
    const totalPacientes = pacientes.length;
    const totalAgendamentos = agendamentos.length;
    const totalSessoes = sessoes.length;
    const totalTransacoes = transacoes.length;

    // Agendamentos por status
    const agendamentosPorStatus = Object.entries(
      agendamentos.reduce(
        (acc, agendamento) => {
          acc[agendamento.statusAgendamento] =
            (acc[agendamento.statusAgendamento] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    ).map(([status, count]) => ({
      status,
      count,
      color: statusColors[status as keyof typeof statusColors] || "#6b7280",
    }));

    // Sessões por status (baseado em pagamentoRealizado e notaFiscal)
    const sessoesPorStatus = Object.entries(
      sessoes.reduce(
        (acc, sessao) => {
          let status: string;
          if (sessao.pagamentoRealizado && sessao.notaFiscal === "Enviada") {
            status = "Nota Fiscal Enviada";
          } else if (
            sessao.pagamentoRealizado &&
            sessao.notaFiscal === "Emitida"
          ) {
            status = "Nota Fiscal Emitida";
          } else if (sessao.pagamentoRealizado) {
            status = "Pagamento Realizado";
          } else {
            status = "Pagamento Pendente";
          }

          acc[status] = (acc[status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    ).map(([status, count]) => ({
      status,
      count,
      color: statusColors[status as keyof typeof statusColors] || "#6b7280",
    }));

    // Cálculos financeiros
    // Filtrar sessões pagas com valores válidos para cálculo de receita
    const sessoesPagasComValor = sessoes.filter((sessao) => {
      // Verificar se o pagamento foi realizado
      if (!sessao.pagamentoRealizado) {
        return false;
      }

      // Verificar se tem valor válido
      const valorSessao = sessao.valorSessao;
      if (typeof valorSessao === "number") {
        return valorSessao > 0;
      } else if (typeof valorSessao === "string") {
        const valor = parseFloat(valorSessao);
        return !isNaN(valor) && valor > 0;
      }
      return false;
    });

    const receitaSessoes = sessoesPagasComValor.reduce((acc, sessao) => {
      // Garantir que o valor seja válido e convertido corretamente
      const valorSessao = sessao.valorSessao;
      let valor = 0;

      if (typeof valorSessao === "number") {
        valor = valorSessao;
      } else if (typeof valorSessao === "string") {
        valor = parseFloat(valorSessao) || 0;
      }

      return acc + valor;
    }, 0);

    const entradasTransacoes = transacoes
      .filter((t) => t.tipo === "entrada")
      .reduce((acc, t) => acc + t.valor, 0);
    const saidasTransacoes = transacoes
      .filter((t) => t.tipo === "saida")
      .reduce((acc, t) => acc + t.valor, 0);

    const receita = receitaSessoes + entradasTransacoes;
    const gastos = saidasTransacoes;
    const saldoTotal = receita - gastos;

    // Sessões por mês (últimos 6 meses)
    const agora = new Date();
    const sessoesPorMes = Array.from({ length: 6 }, (_, i) => {
      const data = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
      const mesAno = data.toLocaleDateString("pt-BR", {
        month: "short",
        year: "numeric",
      });

      const sessoesDoMes = sessoes.filter((sessao) => {
        const dataSessao = new Date(
          sessao.agendamentoInfo?.dataAgendamento || sessao.created_at || "",
        );
        return (
          dataSessao.getMonth() === data.getMonth() &&
          dataSessao.getFullYear() === data.getFullYear()
        );
      });

      return {
        mes: mesAno,
        count: sessoesDoMes.length,
        receita: sessoesDoMes.reduce((acc, s) => acc + (s.valorSessao || 0), 0),
      };
    }).reverse(); // Pacientes por origem
    const pacientesPorOrigem = Object.entries(
      pacientes.reduce(
        (acc, paciente) => {
          acc[paciente.origem] = (acc[paciente.origem] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    ).map(([origem, count]) => ({
      origem,
      count,
      color: origemColors[origem as keyof typeof origemColors] || "#6b7280",
    }));

    // Sessões por terapeuta
    const sessoesPorTerapeuta = terapeutas
      .map((terapeuta) => {
        const sessoesDoTerapeuta = sessoes.filter(
          (s) => s.terapeuta_id === terapeuta.id,
        );
        return {
          nome: terapeuta.nome,
          count: sessoesDoTerapeuta.length,
          receita: sessoesDoTerapeuta.reduce(
            (acc, s) => acc + (s.valorSessao || 0),
            0,
          ),
        };
      })
      .sort((a, b) => b.count - a.count);

    // Crescimento mensal (comparando mês atual com mês anterior)
    const mesAtual = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const mesAnterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);

    const pacientesEsteMs = pacientes.filter((p) => {
      const dataEntrada = new Date(p.dt_entrada);
      return dataEntrada >= mesAtual;
    }).length;

    const pacientesMesAnterior = pacientes.filter((p) => {
      const dataEntrada = new Date(p.dt_entrada);
      return dataEntrada >= mesAnterior && dataEntrada < mesAtual;
    }).length;

    const sessoesEsteMs = sessoes.filter((s) => {
      const dataSessao = new Date(
        s.agendamentoInfo?.dataAgendamento || s.created_at || "",
      );
      return dataSessao >= mesAtual;
    }).length;

    const sessoesMesAnterior = sessoes.filter((s) => {
      const dataSessao = new Date(
        s.agendamentoInfo?.dataAgendamento || s.created_at || "",
      );
      return dataSessao >= mesAnterior && dataSessao < mesAtual;
    }).length;

    const receitaEsteMs = sessoes
      .filter((s) => {
        const dataSessao = new Date(
          s.agendamentoInfo?.dataAgendamento || s.created_at || "",
        );
        return dataSessao >= mesAtual;
      })
      .reduce((acc, s) => acc + (s.valorSessao || 0), 0);

    const receitaMesAnterior = sessoes
      .filter((s) => {
        const dataSessao = new Date(
          s.agendamentoInfo?.dataAgendamento || s.created_at || "",
        );
        return dataSessao >= mesAnterior && dataSessao < mesAtual;
      })
      .reduce((acc, s) => acc + (s.valorSessao || 0), 0);

    const crescimentoMensal = {
      pacientes:
        pacientesMesAnterior === 0
          ? 100
          : ((pacientesEsteMs - pacientesMesAnterior) / pacientesMesAnterior) *
            100,
      sessoes:
        sessoesMesAnterior === 0
          ? 100
          : ((sessoesEsteMs - sessoesMesAnterior) / sessoesMesAnterior) * 100,
      receita:
        receitaMesAnterior === 0
          ? 100
          : ((receitaEsteMs - receitaMesAnterior) / receitaMesAnterior) * 100,
    };

    // Cálculos específicos para o valor médio por sessão
    const valorMedioPorSessao =
      sessoesPagasComValor.length > 0
        ? receitaSessoes / sessoesPagasComValor.length
        : 0;

    return {
      totalTerapeutas,
      totalPacientes,
      totalAgendamentos,
      totalSessoes,
      totalTransacoes,
      agendamentosPorStatus,
      sessoesPorStatus,
      receita,
      gastos,
      saldoTotal,
      receitaTotalSessoes: receitaSessoes,
      sessoesComValor: sessoesPagasComValor.length,
      valorMedioPorSessao,
      sessoesPorMes,
      pacientesPorOrigem,
      sessoesPorTerapeuta,
      crescimentoMensal,
    };
  }, [terapeutas, pacientes, agendamentos, sessoes, transacoes]);

  return { stats, isLoading, error };
}
