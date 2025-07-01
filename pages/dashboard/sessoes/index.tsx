import {
  CalendarCheck,
  Calendar,
  Receipt,
  CaretLeft,
  CaretRight,
  User,
  ChartPie,
  MagnifyingGlass,
  Info,
  FileText,
  PaperPlaneTilt,
  CaretUp,
  CaretDown,
} from "@phosphor-icons/react";
import Head from "next/head";
import React, { useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "store/store";
import { updateSessao } from "store/sessoesSlice";
import { Sessao } from "tipos";

import { useFetchSessoes } from "hooks/useFetchSessoes";
import { useFetchTerapeutas } from "hooks/useFetchTerapeutas";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, addMonths } from "date-fns";
import { formatSessaoDate, parseAnyDate } from "utils/dateUtils";
import { ptBR } from "date-fns/locale";
import useAuth from "hooks/useAuth";
import { EditarSessaoModal } from "components/Sessoes/EditarSessaoModal";
import { toast } from "sonner";
import { Tabs, Tab } from "components/common/Tabs";

// Função auxiliar para obter o valor de repasse correto
function obterValorRepasse(sessao: Sessao): number {
  // Se existe um valor de repasse personalizado, use-o
  if (sessao.valorRepasse !== undefined && sessao.valorRepasse !== null) {
    return Number(sessao.valorRepasse);
  }

  // Caso contrário, calcular com base na regra padrão
  if (sessao.terapeutaInfo?.dt_entrada) {
    return calcularRepasse(sessao.valorSessao, sessao.terapeutaInfo.dt_entrada);
  }

  // Fallback (não deveria acontecer, mas por segurança)
  return sessao.valorSessao * 0.45;
}

// Status de sessão para filtro
const STATUS_SESSOES = [
  "Todos",
  "Pagamento Pendente",
  "Pagamento Realizado",
  "Nota Fiscal Emitida",
  "Nota Fiscal Enviada",
];

// Tipos de sessão para filtro
const TIPOS_SESSOES = [
  "Todos",
  "Anamnese",
  "Atendimento",
  "Avaliação",
  "Visitar Escolar",
];

// Função para filtrar sessões com base nos critérios
const filterSessoes = (
  sessoes: Sessao[],
  selectedTerapeuta: string,
  selectedStatus: string,
  selectedTipo: string,
  selectedMonth: Date,
  searchPaciente: string = "",
): Sessao[] => {
  // Verificar se sessoes é um array válido
  if (!Array.isArray(sessoes)) {
    return [];
  }

  // Ordenamos as sessões (do mais recente para o mais antigo)
  return sessoes
    .slice() // Copia o array para não modificar o original
    .sort((a, b) => {
      // Ordenando por data do agendamento (se existir)
      const dateA = a.agendamentoInfo?.dataAgendamento
        ? parseAnyDate(a.agendamentoInfo.dataAgendamento).getTime()
        : 0;
      const dateB = b.agendamentoInfo?.dataAgendamento
        ? parseAnyDate(b.agendamentoInfo.dataAgendamento).getTime()
        : 0;
      return dateA - dateB; // Da mais próxima para a mais distante
    })
    .filter((sessao) => {
      // Filtrar por terapeuta
      const matchesTerapeuta =
        selectedTerapeuta === "Todos" ||
        (sessao.terapeutaInfo &&
          String(sessao.terapeutaInfo.id) === String(selectedTerapeuta));

      // Filtrar por status
      const matchesStatus =
        selectedStatus === "Todos" || sessao.statusSessao === selectedStatus;

      // Filtrar por tipo
      const matchesTipo =
        selectedTipo === "Todos" || sessao.tipoSessao === selectedTipo;

      // Filtrar por paciente (se houver busca)
      const matchesPacienteSearch =
        searchPaciente === "" ||
        sessao.pacienteInfo?.nome
          .toLowerCase()
          .includes(searchPaciente.toLowerCase());

      // Filtrar por mês selecionado (verificando a data do agendamento)
      let matchesMonth = false;

      // Verifica se a data do agendamento está dentro do mês selecionado
      if (sessao.agendamentoInfo?.dataAgendamento) {
        try {
          const data = parseAnyDate(sessao.agendamentoInfo.dataAgendamento);
          if (!isNaN(data.getTime())) {
            // Usar uma comparação mais robusta que considera apenas ano e mês
            const anoMesSessao = format(data, "yyyy-MM");
            const anoMesSelecionado = format(selectedMonth, "yyyy-MM");

            if (anoMesSessao === anoMesSelecionado) {
              matchesMonth = true;
            }
          }
        } catch (error) {
          console.warn(
            "Erro ao processar data da sessão:",
            sessao.agendamentoInfo.dataAgendamento,
            error,
          );
        }
      }

      return (
        matchesTerapeuta &&
        matchesStatus &&
        matchesTipo &&
        matchesMonth &&
        matchesPacienteSearch
      );
    });
};

// Função para filtrar sessões apenas pelo mês (para cálculos financeiros totais)
const filterSessoesByMonth = (
  sessoes: Sessao[],
  selectedMonth: Date,
): Sessao[] => {
  if (!Array.isArray(sessoes)) {
    return [];
  }

  return sessoes.filter((sessao) => {
    // Verifica se a data do agendamento está dentro do mês selecionado
    if (sessao.agendamentoInfo?.dataAgendamento) {
      try {
        const data = parseAnyDate(sessao.agendamentoInfo.dataAgendamento);
        if (!isNaN(data.getTime())) {
          // Usar uma comparação mais robusta que considera apenas ano e mês
          const anoMesSessao = format(data, "yyyy-MM");
          const anoMesSelecionado = format(selectedMonth, "yyyy-MM");

          if (anoMesSessao === anoMesSelecionado) {
            return true;
          }
        }
      } catch (error) {
        console.warn(
          "Erro ao processar data da sessão:",
          sessao.agendamentoInfo.dataAgendamento,
          error,
        );
      }
    }

    return false;
  });
};

// Função para calcular repasse baseado no tempo de casa do terapeuta
const calcularRepasse = (
  valorSessao: number,
  dtEntrada: Date | string,
): number => {
  if (!valorSessao || !dtEntrada) return 0;

  // Converter string para data se necessário
  const dataEntrada =
    typeof dtEntrada === "string" ? parseAnyDate(dtEntrada) : dtEntrada;

  // Verificar se a data é válida
  if (isNaN(dataEntrada.getTime())) return 0;

  // Calcular diferença em anos de forma mais precisa
  const hoje = new Date();

  // Calcular a diferença em milissegundos
  const diferencaEmMilissegundos = hoje.getTime() - dataEntrada.getTime();

  // Um ano em milissegundos (considerando anos bissextos)
  const umAnoEmMilissegundos = 365.25 * 24 * 60 * 60 * 1000;

  // Calcular anos na clínica
  const anosNaClinica = diferencaEmMilissegundos / umAnoEmMilissegundos;

  // Determinar percentual de repasse
  const percentualRepasse = anosNaClinica >= 1 ? 0.5 : 0.45;

  return valorSessao * percentualRepasse;
};

// Função para determinar o estado do checkbox de um grupo
const getGroupRepasseState = (sessoes: Sessao[]) => {
  const totalSessoes = sessoes.length;
  const sessoesComRepasse = sessoes.filter((s) => s.repasseRealizado).length;

  if (sessoesComRepasse === 0) return "none"; // nenhuma marcada
  if (sessoesComRepasse === totalSessoes) return "all"; // todas marcadas
  return "partial"; // algumas marcadas
};

export default function Sessoes() {
  // Utilizar hooks do Redux
  const { sessoes, isLoading, isError, mutate } = useFetchSessoes();
  const { terapeutas } = useFetchTerapeutas();
  const { canEdit } = useAuth();
  const dispatch = useDispatch<AppDispatch>();

  const [selectedTerapeuta, setSelectedTerapeuta] = useState("Todos");
  const [selectedStatus, setSelectedStatus] = useState("Todos");
  const [selectedTipo, setSelectedTipo] = useState("Todos");
  const [searchPaciente, setSearchPaciente] = useState("");
  const [showLegend, setShowLegend] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  const [sessaoEditando, setSessaoEditando] = useState<Sessao | null>(null);
  // const [activeTab, setActiveTab] = useState<"terapeutas" | "pacientes">(
  //   "terapeutas",
  // );
  const [expandedTherapists, setExpandedTherapists] = useState<string[]>([]);
  const [expandedPatients, setExpandedPatients] = useState<string[]>([]);
  const [loadingBulkUpdate, setLoadingBulkUpdate] = useState<string | null>(
    null,
  );

  const toggleAccordion = (type: "terapeuta" | "paciente", id: string) => {
    if (type === "terapeuta") {
      setExpandedTherapists((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
      );
    } else {
      setExpandedPatients((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
      );
    }
  };

  // Filtrar sessões - com segurança para quando sessoes for null ou undefined
  const filteredSessoes = useMemo(
    () =>
      !isLoading && sessoes
        ? filterSessoes(
            sessoes,
            selectedTerapeuta,
            selectedStatus,
            selectedTipo,
            currentDate,
            searchPaciente,
          )
        : [],
    [
      isLoading,
      sessoes,
      selectedTerapeuta,
      selectedStatus,
      selectedTipo,
      currentDate,
      searchPaciente,
    ],
  );

  // Agrupar sessões por terapeuta
  const groupedSessoesByTerapeuta = useMemo(() => {
    return filteredSessoes.reduce(
      (acc, sessao) => {
        const terapeutaId = sessao.terapeutaInfo?.id || "unassigned";
        if (!acc[terapeutaId]) {
          acc[terapeutaId] = [];
        }
        acc[terapeutaId].push(sessao);
        return acc;
      },
      {} as Record<string, Sessao[]>,
    );
  }, [filteredSessoes]);

  // Agrupar sessões por paciente
  const groupedSessoesByPaciente = useMemo(() => {
    return filteredSessoes.reduce(
      (acc, sessao) => {
        const pacienteId = sessao.pacienteInfo?.id || "unassigned";
        if (!acc[pacienteId]) {
          acc[pacienteId] = [];
        }
        acc[pacienteId].push(sessao);
        return acc;
      },
      {} as Record<string, Sessao[]>,
    );
  }, [filteredSessoes]);

  // Valor total das notas fiscais emitidas - com segurança
  const valorNotasFiscaisEmitidas = useMemo(() => {
    if (!Array.isArray(sessoes)) return 0;

    // Filtrar pelo mês atual primeiro
    const sessoesMes = filterSessoesByMonth(sessoes, currentDate);

    // Depois filtrar por status "Nota Fiscal Emitida"
    return sessoesMes
      .filter((sessao) => sessao.statusSessao === "Nota Fiscal Emitida")
      .reduce((total, sessao) => total + (sessao.valorSessao || 0), 0);
  }, [sessoes, currentDate]);

  // Valor total das notas fiscais enviadas - com segurança
  const valorNotasFiscaisEnviadas = useMemo(() => {
    if (!Array.isArray(sessoes)) return 0;

    // Filtrar pelo mês atual primeiro
    const sessoesMes = filterSessoesByMonth(sessoes, currentDate);

    // Depois filtrar por status "Nota Fiscal Enviada"
    return sessoesMes
      .filter((sessao) => sessao.statusSessao === "Nota Fiscal Enviada")
      .reduce((total, sessao) => {
        // Verificar se temos as informações do terapeuta
        if (!sessao.terapeutaInfo || !sessao.terapeutaInfo.dt_entrada)
          return total;

        // Calcular o repasse para esta sessão específica
        const repasse = obterValorRepasse(sessao);
        return total + repasse;
      }, 0);
  }, [sessoes, currentDate]);

  const sessoesPendentes = useMemo(() => {
    if (!Array.isArray(sessoes)) return 0;

    // Filtrar pelo mês atual primeiro
    const sessoesMes = filterSessoesByMonth(sessoes, currentDate);

    // Depois filtrar por status pendente
    return sessoesMes.filter(
      (sessao) => sessao.statusSessao === "Pagamento Pendente",
    ).length;
  }, [sessoes, currentDate]);

  const sessoesRealizadas = useMemo(() => {
    if (!Array.isArray(sessoes)) return 0;

    // Filtrar pelo mês atual primeiro
    const sessoesMes = filterSessoesByMonth(sessoes, currentDate);

    // Depois filtrar por status realizado
    return sessoesMes.filter(
      (sessao) => sessao.statusSessao === "Pagamento Realizado",
    ).length;
  }, [sessoes, currentDate]);

  // Handlers

  const handleEditSessao = (sessao: Sessao) => {
    setSessaoEditando(sessao);
  };

  const handleEditSuccess = () => {
    setSessaoEditando(null);
    mutate();
    toast.success("Sessão atualizada com sucesso!");
  };

  // Função para atualizar repasse realizado de todas as sessões de um grupo
  const handleBulkUpdateRepasse = async (
    sessoes: Sessao[],
    repasseRealizado: boolean,
    groupId: string,
    groupName: string,
  ) => {
    try {
      setLoadingBulkUpdate(groupId);

      // Atualizar todas as sessões do grupo
      const updatePromises = sessoes.map((sessao) =>
        dispatch(
          updateSessao({
            id: sessao.id,
            sessao: { repasseRealizado },
          }),
        ).unwrap(),
      );

      await Promise.all(updatePromises);

      // Invalidar cache
      mutate();

      toast.success(
        `Repasse ${repasseRealizado ? "marcado como realizado" : "desmarcado"} para todas as sessões de ${groupName}`,
      );
    } catch (error) {
      console.error("Erro ao atualizar repasses:", error);
      toast.error("Erro ao atualizar repasses em lote");
    } finally {
      setLoadingBulkUpdate(null);
    }
  };

  const handleDateChange = (date: Date) => {
    setCurrentDate(date);
  };

  const handleMonthChange = (change: number) => {
    const newDate = addMonths(currentDate, change);
    setCurrentDate(newDate);
  };

  // Mostrar estado de carregamento
  if (isLoading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-azul"></div>
        <span className="ml-4 text-xl">Carregando sessões...</span>
      </div>
    );

  // Mostrar estado de erro
  if (isError)
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <div className="text-red-500 text-xl mb-4">Erro ao carregar dados.</div>
        <button
          className="bg-azul text-white px-4 py-2 rounded hover:bg-sky-600"
          onClick={() => mutate()}
        >
          Tentar novamente
        </button>
      </div>
    );

  return (
    <div className="flex min-h-screen">
      <Head>
        <title>Sessões</title>
      </Head>
      <main className="flex-1 bg-gray-100 p-4 min-w-0 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col space-y-4 mb-6 sm:flex-row sm:space-y-0 sm:items-center sm:justify-between">
          <h1 className="text-xl font-semibold sm:text-2xl">Sessões</h1>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <div className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="p-3 bg-yellow-100 rounded-full">
              <Receipt size={24} className="text-yellow-600" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Pagamentos Pendentes
              </h3>
              <span className="text-2xl font-bold text-gray-900">
                {sessoesPendentes}
              </span>
            </div>
          </div>

          <div className="flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-full">
                <ChartPie size={24} className="text-green-600" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Pagamentos Realizados
                </h3>
                <span className="text-2xl font-bold text-gray-900">
                  {sessoesRealizadas}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowLegend(!showLegend)}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-md hover:bg-gray-50 transition-all flex-shrink-0"
              aria-label="Mostrar legenda"
              title="Mostrar legenda"
            >
              <Info size={20} />
            </button>
          </div>

          <div className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="p-3 bg-blue-100 rounded-full">
              <FileText size={24} className="text-blue-600" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Nota Fiscal Emitida
              </h3>
              <span className="text-xl font-bold text-gray-900">
                R$ {valorNotasFiscaisEmitidas.toFixed(2).replace(".", ",")}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="p-3 bg-purple-100 rounded-full">
              <PaperPlaneTilt size={24} className="text-purple-600" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Nota Fiscal Enviada
              </h3>
              <span className="text-xl font-bold text-gray-900">
                R$ {valorNotasFiscaisEnviadas.toFixed(2).replace(".", ",")}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="p-3 bg-green-100 rounded-full">
              <CalendarCheck size={24} className="text-green-600" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Total de Sessões
              </h3>
              <span className="text-2xl font-bold text-gray-900">
                {filteredSessoes.length}
              </span>
            </div>
          </div>
        </div>

        {/* Legenda (mostrada apenas quando o botão é clicado) */}
        {showLegend && (
          <div className="bg-white p-4 rounded shadow mb-6">
            <h3 className="font-medium mb-2">Legenda:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="text-sm font-medium">Status de Pagamento:</h4>
                <div className="flex items-center mt-1">
                  <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                  <span className="text-sm">Pagamento Pendente</span>
                </div>
                <div className="flex items-center mt-1">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-sm">Pagamento Realizado</span>
                </div>
                <div className="flex items-center mt-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                  <span className="text-sm">Nota Fiscal Emitida</span>
                </div>
                <div className="flex items-center mt-1">
                  <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                  <span className="text-sm">Nota Fiscal Enviada</span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium">Tipos de Sessão:</h4>
                <div className="flex items-center mt-1">
                  <div className="w-3 h-3 rounded-sm bg-blue-500 mr-2"></div>
                  <span className="text-sm">Anamnese</span>
                </div>
                <div className="flex items-center mt-1">
                  <div className="w-3 h-3 rounded-sm bg-green-500 mr-2"></div>
                  <span className="text-sm">Atendimento</span>
                </div>
                <div className="flex items-center mt-1">
                  <div className="w-3 h-3 rounded-sm bg-amber-500 mr-2"></div>
                  <span className="text-sm">Avaliação</span>
                </div>
                <div className="flex items-center mt-1">
                  <div className="w-3 h-3 rounded-sm bg-purple-500 mr-2"></div>
                  <span className="text-sm">Visita Escolar</span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium">Gestão de Sessões:</h4>
                <div className="text-sm mt-1">
                  As sessões são criadas automaticamente a partir dos
                  agendamentos.
                </div>
                <div className="text-sm mt-1">
                  Para criar uma nova sessão, crie um novo agendamento na página
                  Agenda.
                </div>
                <div className="text-sm mt-1">
                  Para editar ou excluir uma sessão, edite ou exclua o
                  agendamento correspondente.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Date Navigation */}
        <div className="flex items-center justify-between p-4 bg-white rounded shadow mb-4">
          <button
            type="button"
            aria-label="Mês Anterior"
            onClick={() => handleMonthChange(-1)}
            className="hover:bg-gray-100 p-2 rounded-full transition-colors flex-shrink-0"
          >
            <CaretLeft size={24} weight="fill" />
          </button>
          <div className="flex items-center justify-center min-w-0 px-2 sm:px-4">
            <h2 className="text-sm font-semibold text-center sm:text-lg md:text-xl">
              {format(currentDate, "MMMM yyyy", { locale: ptBR }).replace(
                /^\w/,
                (c) => c.toUpperCase(),
              )}
            </h2>
            <DatePicker
              selected={currentDate}
              onChange={handleDateChange}
              dateFormat="MM/yyyy"
              showMonthYearPicker
              customInput={
                <button
                  type="button"
                  className="hover:bg-gray-100 p-1 rounded flex-shrink-0 ml-2"
                >
                  <Calendar size={20} />
                </button>
              }
            />
          </div>
          <button
            type="button"
            aria-label="Próximo Mês"
            onClick={() => handleMonthChange(1)}
            className="hover:bg-gray-100 p-2 rounded-full transition-colors flex-shrink-0"
          >
            <CaretRight size={24} weight="fill" />
          </button>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 gap-4 mb-6 lg:grid-cols-2 xl:grid-cols-4">
          {/* Filtro por Terapeuta */}
          <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <User size={24} className="text-gray-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <label
                htmlFor="terapeutas"
                className="text-sm font-medium text-gray-700 block mb-2"
              >
                Filtrar por Terapeuta
              </label>
              <select
                className="w-full text-sm lg:text-base border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-azul/20 focus:border-azul"
                name="terapeutas"
                id="terapeutas"
                value={selectedTerapeuta}
                onChange={(e) => {
                  setSelectedTerapeuta(e.target.value);
                }}
              >
                <option value="Todos">Todos os terapeutas</option>
                {terapeutas?.map((terapeuta) => (
                  <option key={terapeuta.id} value={terapeuta.id}>
                    {terapeuta.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filtro por Status */}
          <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <Receipt size={24} className="text-gray-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <label
                htmlFor="status"
                className="text-sm font-medium text-gray-700 block mb-2"
              >
                Filtrar por Status
              </label>
              <select
                className="w-full text-sm lg:text-base border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-azul/20 focus:border-azul"
                name="status"
                id="status"
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                }}
              >
                {STATUS_SESSOES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filtro por Tipo */}
          <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <CalendarCheck size={24} className="text-gray-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <label
                htmlFor="tipo"
                className="text-sm font-medium text-gray-700 block mb-2"
              >
                Filtrar por Tipo
              </label>
              <select
                className="w-full text-sm lg:text-base border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-azul/20 focus:border-azul"
                name="tipo"
                id="tipo"
                value={selectedTipo}
                onChange={(e) => {
                  setSelectedTipo(e.target.value);
                }}
              >
                {TIPOS_SESSOES.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Busca por Paciente */}
          <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <MagnifyingGlass
              size={24}
              className="text-gray-500 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <label
                htmlFor="searchPaciente"
                className="text-sm font-medium text-gray-700 block mb-2"
              >
                Buscar Paciente
              </label>
              <input
                type="text"
                id="searchPaciente"
                className="w-full text-sm lg:text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-azul/20 rounded px-3 py-2 border border-gray-200"
                placeholder="Nome do paciente..."
                value={searchPaciente}
                onChange={(e) => {
                  setSearchPaciente(e.target.value);
                }}
              />
            </div>
          </div>
        </div>

        <Tabs initialActiveTab="Terapeutas">
          <Tab label="Terapeutas">
            {/* Tabela de Sessões */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-rosa text-white">
                    <tr>
                      <th className="p-3 text-left text-sm font-medium">
                        Terapeuta
                      </th>
                      <th className="p-3 text-left text-sm font-medium">
                        Paciente
                      </th>
                      <th className="p-3 text-left text-sm font-medium hidden lg:table-cell">
                        Tipo de Sessão
                      </th>
                      <th className="p-3 text-left text-sm font-medium">
                        Valor
                      </th>
                      <th className="p-3 text-left text-sm font-medium hidden xl:table-cell">
                        Repasse
                      </th>
                      <th className="p-3 text-left text-sm font-medium">
                        Status
                      </th>
                      <th className="p-3 text-left text-sm font-medium hidden lg:table-cell">
                        Data
                      </th>
                      <th className="p-3 text-center text-sm font-medium hidden xl:table-cell">
                        Repasse
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.keys(groupedSessoesByTerapeuta).length > 0 ? (
                      Object.entries(groupedSessoesByTerapeuta).map(
                        ([terapeutaId, sessoesDoTerapeuta]) => {
                          const groupRepasseState =
                            getGroupRepasseState(sessoesDoTerapeuta);
                          const terapeutaNome =
                            sessoesDoTerapeuta[0].terapeutaInfo?.nome ||
                            "Terapeuta Não Atribuído";

                          return (
                            <React.Fragment key={terapeutaId}>
                              <tr
                                className="bg-gray-100 hover:bg-gray-200 cursor-pointer"
                                onClick={(e) => {
                                  // Não expandir/contrair se clicou no checkbox
                                  if (
                                    (e.target as HTMLElement).closest(
                                      'input[type="checkbox"]',
                                    )
                                  ) {
                                    return;
                                  }
                                  toggleAccordion("terapeuta", terapeutaId);
                                }}
                              >
                                <td colSpan={8} className="p-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                      <span className="font-bold text-gray-800">
                                        {terapeutaNome} (
                                        {sessoesDoTerapeuta.length} sessões)
                                      </span>
                                      {canEdit && (
                                        <div
                                          className="flex items-center space-x-2"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={
                                              groupRepasseState === "all"
                                            }
                                            ref={(input) => {
                                              if (input) {
                                                input.indeterminate =
                                                  groupRepasseState ===
                                                  "partial";
                                              }
                                            }}
                                            onChange={async (e) => {
                                              const newState = e.target.checked;
                                              await handleBulkUpdateRepasse(
                                                sessoesDoTerapeuta,
                                                newState,
                                                terapeutaId,
                                                terapeutaNome,
                                              );
                                            }}
                                            disabled={
                                              loadingBulkUpdate === terapeutaId
                                            }
                                            className="h-4 w-4 text-azul focus:ring-azul border-gray-300 rounded"
                                            title={
                                              groupRepasseState === "all"
                                                ? "Desmarcar repasse de todas as sessões"
                                                : groupRepasseState ===
                                                    "partial"
                                                  ? "Marcar repasse de todas as sessões (algumas já marcadas)"
                                                  : "Marcar repasse de todas as sessões"
                                            }
                                          />
                                          <span className="text-xs text-gray-600">
                                            {loadingBulkUpdate === terapeutaId
                                              ? "Atualizando..."
                                              : "Repasse em lote"}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    {expandedTherapists.includes(
                                      terapeutaId,
                                    ) ? (
                                      <CaretUp size={20} />
                                    ) : (
                                      <CaretDown size={20} />
                                    )}
                                  </div>
                                </td>
                              </tr>
                              {expandedTherapists.includes(terapeutaId) &&
                                sessoesDoTerapeuta.map((sessao, index) => {
                                  const dataExibicao = formatSessaoDate(sessao);
                                  const valorRepasse =
                                    obterValorRepasse(sessao);
                                  let percentualRepasse = 0;

                                  if (
                                    sessao.valorRepasse !== undefined &&
                                    sessao.valorRepasse !== null
                                  ) {
                                    percentualRepasse = Math.round(
                                      (sessao.valorRepasse /
                                        sessao.valorSessao) *
                                        100,
                                    );
                                  } else {
                                    if (sessao.terapeutaInfo?.dt_entrada) {
                                      const dataEntrada = parseAnyDate(
                                        sessao.terapeutaInfo.dt_entrada,
                                      );
                                      const hoje = new Date();
                                      const diferencaEmMilissegundos =
                                        hoje.getTime() - dataEntrada.getTime();
                                      const umAnoEmMilissegundos =
                                        365.25 * 24 * 60 * 60 * 1000;
                                      const anosNaClinica =
                                        diferencaEmMilissegundos /
                                        umAnoEmMilissegundos;
                                      percentualRepasse =
                                        anosNaClinica >= 1 ? 50 : 45;
                                    } else {
                                      percentualRepasse = 45;
                                    }
                                  }

                                  return (
                                    <tr
                                      key={sessao.id}
                                      className={`hover:bg-blue-50 cursor-pointer transition-colors ${
                                        index % 2 === 0
                                          ? "bg-white"
                                          : "bg-gray-50/50"
                                      }`}
                                      onClick={() =>
                                        canEdit && handleEditSessao(sessao)
                                      }
                                    >
                                      <td className="p-3 pl-8">
                                        <div className="font-medium text-gray-900 text-sm lg:text-base">
                                          {sessao.terapeutaInfo?.nome || (
                                            <span className="text-orange-600 font-medium">
                                              Não atribuído
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="p-3">
                                        <div className="text-sm lg:text-base text-gray-900">
                                          {sessao.pacienteInfo?.nome || (
                                            <span className="text-orange-600 font-medium">
                                              Não atribuído
                                            </span>
                                          )}
                                        </div>
                                        <div className="lg:hidden mt-1 space-y-1">
                                          <div className="text-xs text-gray-500">
                                            Tipo: {sessao.tipoSessao}
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            Data: {dataExibicao}
                                          </div>
                                        </div>
                                      </td>
                                      <td className="p-3 hidden lg:table-cell text-sm text-gray-600">
                                        <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium">
                                          {sessao.tipoSessao}
                                        </span>
                                      </td>
                                      <td className="p-3">
                                        <div className="text-sm lg:text-base font-semibold text-gray-900">
                                          R${" "}
                                          {sessao.valorSessao
                                            .toFixed(2)
                                            .replace(".", ",")}
                                        </div>
                                        <div className="xl:hidden text-xs text-gray-500 mt-1">
                                          Repasse: R${" "}
                                          {valorRepasse
                                            .toFixed(2)
                                            .replace(".", ",")}{" "}
                                          ( {percentualRepasse}%)
                                        </div>
                                      </td>
                                      <td className="p-3 hidden xl:table-cell text-sm text-gray-600">
                                        <div className="text-sm font-medium text-green-600">
                                          R${" "}
                                          {valorRepasse
                                            .toFixed(2)
                                            .replace(".", ",")}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {percentualRepasse}% do valor
                                        </div>
                                      </td>
                                      <td className="p-3">
                                        <span
                                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                            sessao.statusSessao ===
                                            "Pagamento Pendente"
                                              ? "bg-yellow-100 text-yellow-800"
                                              : sessao.statusSessao ===
                                                  "Pagamento Realizado"
                                                ? "bg-green-100 text-green-800"
                                                : sessao.statusSessao ===
                                                    "Nota Fiscal Emitida"
                                                  ? "bg-blue-100 text-blue-800"
                                                  : sessao.statusSessao ===
                                                      "Nota Fiscal Enviada"
                                                    ? "bg-purple-100 text-purple-800"
                                                    : "bg-gray-100 text-gray-800"
                                          }`}
                                        >
                                          <span className="hidden sm:inline">
                                            {sessao.statusSessao}
                                          </span>
                                          <span className="sm:hidden">
                                            {sessao.statusSessao ===
                                            "Pagamento Pendente"
                                              ? "Pendente"
                                              : sessao.statusSessao ===
                                                  "Pagamento Realizado"
                                                ? "Realizado"
                                                : sessao.statusSessao ===
                                                    "Nota Fiscal Emitida"
                                                  ? "NF Emitida"
                                                  : sessao.statusSessao ===
                                                      "Nota Fiscal Enviada"
                                                    ? "NF Enviada"
                                                    : sessao.statusSessao}
                                          </span>
                                        </span>
                                      </td>
                                      <td className="p-3 hidden lg:table-cell text-sm text-gray-600">
                                        {dataExibicao}
                                      </td>
                                      <td className="p-3 hidden xl:table-cell text-center">
                                        <div className="flex justify-center">
                                          {sessao.repasseRealizado ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                              ✓ Realizado
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                              Pendente
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              {/* Totalizador para o grupo de terapeuta */}
                              {expandedTherapists.includes(terapeutaId) && (
                                <tr className="bg-gray-50 font-semibold">
                                  <td
                                    colSpan={3}
                                    className="p-3 pl-8 text-right text-sm text-gray-700"
                                  >
                                    Total:
                                  </td>
                                  <td className="p-3 text-sm text-gray-900">
                                    R${" "}
                                    {sessoesDoTerapeuta
                                      .reduce(
                                        (total, sessao) =>
                                          total + sessao.valorSessao,
                                        0,
                                      )
                                      .toFixed(2)
                                      .replace(".", ",")}
                                  </td>
                                  <td className="p-3 hidden xl:table-cell text-sm text-green-600">
                                    R${" "}
                                    {sessoesDoTerapeuta
                                      .reduce(
                                        (total, sessao) =>
                                          total + obterValorRepasse(sessao),
                                        0,
                                      )
                                      .toFixed(2)
                                      .replace(".", ",")}
                                  </td>
                                  <td colSpan={3} className="p-3"></td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        },
                      )
                    ) : (
                      <tr>
                        <td colSpan={8} className="text-center py-12 px-4">
                          <div className="max-w-md mx-auto">
                            <CalendarCheck
                              size={64}
                              className="mx-auto mb-4 text-gray-300"
                            />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              Nenhuma sessão encontrada
                            </h3>
                            <p className="text-gray-600">
                              Tente ajustar os filtros de busca para encontrar o
                              que está procurando.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Tab>
          <Tab label="Pacientes">
            {/* Conteúdo da aba de pacientes */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-rosa text-white">
                    <tr>
                      <th className="p-3 text-left text-sm font-medium">
                        Paciente
                      </th>
                      <th className="p-3 text-left text-sm font-medium">
                        Terapeuta
                      </th>
                      <th className="p-3 text-left text-sm font-medium hidden lg:table-cell">
                        Tipo de Sessão
                      </th>
                      <th className="p-3 text-left text-sm font-medium">
                        Valor
                      </th>
                      <th className="p-3 text-left text-sm font-medium hidden xl:table-cell">
                        Repasse
                      </th>
                      <th className="p-3 text-left text-sm font-medium">
                        Status
                      </th>
                      <th className="p-3 text-left text-sm font-medium hidden lg:table-cell">
                        Data
                      </th>
                      <th className="p-3 text-center text-sm font-medium hidden xl:table-cell">
                        Repasse
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.keys(groupedSessoesByPaciente).length > 0 ? (
                      Object.entries(groupedSessoesByPaciente).map(
                        ([pacienteId, sessoesDoPaciente]) => {
                          const groupRepasseState =
                            getGroupRepasseState(sessoesDoPaciente);
                          const pacienteNome =
                            sessoesDoPaciente[0].pacienteInfo?.nome ||
                            "Paciente Não Atribuído";

                          return (
                            <React.Fragment key={pacienteId}>
                              <tr
                                className="bg-gray-100 hover:bg-gray-200 cursor-pointer"
                                onClick={(e) => {
                                  // Não expandir/contrair se clicou no checkbox
                                  if (
                                    (e.target as HTMLElement).closest(
                                      'input[type="checkbox"]',
                                    )
                                  ) {
                                    return;
                                  }
                                  toggleAccordion("paciente", pacienteId);
                                }}
                              >
                                <td colSpan={8} className="p-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                      <span className="font-bold text-gray-800">
                                        {pacienteNome} (
                                        {sessoesDoPaciente.length} sessões)
                                      </span>
                                      {canEdit && (
                                        <div
                                          className="flex items-center space-x-2"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={
                                              groupRepasseState === "all"
                                            }
                                            ref={(input) => {
                                              if (input) {
                                                input.indeterminate =
                                                  groupRepasseState ===
                                                  "partial";
                                              }
                                            }}
                                            onChange={async (e) => {
                                              const newState = e.target.checked;
                                              await handleBulkUpdateRepasse(
                                                sessoesDoPaciente,
                                                newState,
                                                pacienteId,
                                                pacienteNome,
                                              );
                                            }}
                                            disabled={
                                              loadingBulkUpdate === pacienteId
                                            }
                                            className="h-4 w-4 text-azul focus:ring-azul border-gray-300 rounded"
                                            title={
                                              groupRepasseState === "all"
                                                ? "Desmarcar repasse de todas as sessões"
                                                : groupRepasseState ===
                                                    "partial"
                                                  ? "Marcar repasse de todas as sessões (algumas já marcadas)"
                                                  : "Marcar repasse de todas as sessões"
                                            }
                                          />
                                          <span className="text-xs text-gray-600">
                                            {loadingBulkUpdate === pacienteId
                                              ? "Atualizando..."
                                              : "Repasse em lote"}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    {expandedPatients.includes(pacienteId) ? (
                                      <CaretUp size={20} />
                                    ) : (
                                      <CaretDown size={20} />
                                    )}
                                  </div>
                                </td>
                              </tr>
                              {expandedPatients.includes(pacienteId) &&
                                sessoesDoPaciente.map((sessao, index) => {
                                  const dataExibicao = formatSessaoDate(sessao);
                                  const valorRepasse =
                                    obterValorRepasse(sessao);
                                  let percentualRepasse = 0;

                                  if (
                                    sessao.valorRepasse !== undefined &&
                                    sessao.valorRepasse !== null
                                  ) {
                                    percentualRepasse = Math.round(
                                      (sessao.valorRepasse /
                                        sessao.valorSessao) *
                                        100,
                                    );
                                  } else {
                                    if (sessao.terapeutaInfo?.dt_entrada) {
                                      const dataEntrada = parseAnyDate(
                                        sessao.terapeutaInfo.dt_entrada,
                                      );
                                      const hoje = new Date();
                                      const diferencaEmMilissegundos =
                                        hoje.getTime() - dataEntrada.getTime();
                                      const umAnoEmMilissegundos =
                                        365.25 * 24 * 60 * 60 * 1000;
                                      const anosNaClinica =
                                        diferencaEmMilissegundos /
                                        umAnoEmMilissegundos;
                                      percentualRepasse =
                                        anosNaClinica >= 1 ? 50 : 45;
                                    } else {
                                      percentualRepasse = 45;
                                    }
                                  }

                                  return (
                                    <tr
                                      key={sessao.id}
                                      className={`hover:bg-blue-50 cursor-pointer transition-colors ${
                                        index % 2 === 0
                                          ? "bg-white"
                                          : "bg-gray-50/50"
                                      }`}
                                      onClick={() =>
                                        canEdit && handleEditSessao(sessao)
                                      }
                                    >
                                      <td className="p-3 pl-8">
                                        <div className="font-medium text-gray-900 text-sm lg:text-base">
                                          {sessao.pacienteInfo?.nome || (
                                            <span className="text-orange-600 font-medium">
                                              Não atribuído
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="p-3">
                                        <div className="text-sm lg:text-base text-gray-900">
                                          {sessao.terapeutaInfo?.nome || (
                                            <span className="text-orange-600 font-medium">
                                              Não atribuído
                                            </span>
                                          )}
                                        </div>
                                        <div className="lg:hidden mt-1 space-y-1">
                                          <div className="text-xs text-gray-500">
                                            Tipo: {sessao.tipoSessao}
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            Data: {dataExibicao}
                                          </div>
                                        </div>
                                      </td>
                                      <td className="p-3 hidden lg:table-cell text-sm text-gray-600">
                                        <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium">
                                          {sessao.tipoSessao}
                                        </span>
                                      </td>
                                      <td className="p-3">
                                        <div className="text-sm lg:text-base font-semibold text-gray-900">
                                          R${" "}
                                          {sessao.valorSessao
                                            .toFixed(2)
                                            .replace(".", ",")}
                                        </div>
                                        <div className="xl:hidden text-xs text-gray-500 mt-1">
                                          Repasse: R${" "}
                                          {valorRepasse
                                            .toFixed(2)
                                            .replace(".", ",")}{" "}
                                          ( {percentualRepasse}%)
                                        </div>
                                      </td>
                                      <td className="p-3 hidden xl:table-cell text-sm text-gray-600">
                                        <div className="text-sm font-medium text-green-600">
                                          R${" "}
                                          {valorRepasse
                                            .toFixed(2)
                                            .replace(".", ",")}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {percentualRepasse}% do valor
                                        </div>
                                      </td>
                                      <td className="p-3">
                                        <span
                                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                            sessao.statusSessao ===
                                            "Pagamento Pendente"
                                              ? "bg-yellow-100 text-yellow-800"
                                              : sessao.statusSessao ===
                                                  "Pagamento Realizado"
                                                ? "bg-green-100 text-green-800"
                                                : sessao.statusSessao ===
                                                    "Nota Fiscal Emitida"
                                                  ? "bg-blue-100 text-blue-800"
                                                  : sessao.statusSessao ===
                                                      "Nota Fiscal Enviada"
                                                    ? "bg-purple-100 text-purple-800"
                                                    : "bg-gray-100 text-gray-800"
                                          }`}
                                        >
                                          <span className="hidden sm:inline">
                                            {sessao.statusSessao}
                                          </span>
                                          <span className="sm:hidden">
                                            {sessao.statusSessao ===
                                            "Pagamento Pendente"
                                              ? "Pendente"
                                              : sessao.statusSessao ===
                                                  "Pagamento Realizado"
                                                ? "Realizado"
                                                : sessao.statusSessao ===
                                                    "Nota Fiscal Emitida"
                                                  ? "NF Emitida"
                                                  : sessao.statusSessao ===
                                                      "Nota Fiscal Enviada"
                                                    ? "NF Enviada"
                                                    : sessao.statusSessao}
                                          </span>
                                        </span>
                                      </td>
                                      <td className="p-3 hidden lg:table-cell text-sm text-gray-600">
                                        {dataExibicao}
                                      </td>
                                      <td className="p-3 hidden xl:table-cell text-center">
                                        <div className="flex justify-center">
                                          {sessao.repasseRealizado ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                              ✓ Realizado
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                              Pendente
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              {/* Totalizador para o grupo de paciente */}
                              {expandedPatients.includes(pacienteId) && (
                                <tr className="bg-gray-50 font-semibold">
                                  <td
                                    colSpan={3}
                                    className="p-3 pl-8 text-right text-sm text-gray-700"
                                  >
                                    Total:
                                  </td>
                                  <td className="p-3 text-sm text-gray-900">
                                    R${" "}
                                    {sessoesDoPaciente
                                      .reduce(
                                        (total, sessao) =>
                                          total + sessao.valorSessao,
                                        0,
                                      )
                                      .toFixed(2)
                                      .replace(".", ",")}
                                  </td>
                                  <td className="p-3 hidden xl:table-cell text-sm text-green-600">
                                    R${" "}
                                    {sessoesDoPaciente
                                      .reduce(
                                        (total, sessao) =>
                                          total + obterValorRepasse(sessao),
                                        0,
                                      )
                                      .toFixed(2)
                                      .replace(".", ",")}
                                  </td>
                                  <td colSpan={3} className="p-3"></td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        },
                      )
                    ) : (
                      <tr>
                        <td colSpan={8} className="text-center py-12 px-4">
                          <div className="max-w-md mx-auto">
                            <CalendarCheck
                              size={64}
                              className="mx-auto mb-4 text-gray-300"
                            />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              Nenhuma sessão encontrada
                            </h3>
                            <p className="text-gray-600">
                              Tente ajustar os filtros de busca para encontrar o
                              que está procurando.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Tab>
        </Tabs>

        {/* Edit Session Modal */}
        {sessaoEditando && (
          <EditarSessaoModal
            sessao={sessaoEditando}
            open={!!sessaoEditando}
            onClose={() => setSessaoEditando(null)}
            onSuccess={handleEditSuccess}
          />
        )}
      </main>
    </div>
  );
}
