import {
  CalendarCheck,
  Calendar,
  Plus,
  Users,
  CaretLeft,
  CaretRight,
  User,
  Door,
  MagnifyingGlass,
  CalendarX,
  Info,
} from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import { NovoAgendamentoModal } from "components/Agendamento/NovoAgendamentoModal";
import { EditarAgendamentoModal } from "components/Agendamento/EditarAgendamentoModal";
import { DeletarAgendamentoModal } from "components/Agendamento/DeletarAgendamentoModal";
import { AgendaSemanal } from "components/Agendamento/AgendaSemanal";
import { AgendaMensal } from "components/Agendamento/AgendaMensal";
import { AgendaPorTerapeuta } from "components/Agendamento/AgendaPorTerapeuta";
import { AgendaPeriodoPersonalizado } from "components/Agendamento/AgendaPeriodoPersonalizado";
import Head from "next/head";
import React, { useMemo, useState } from "react";
import { Agendamento, Terapeuta } from "tipos";
import {
  format,
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  isSameMonth,
  isSameWeek,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { useFetchAgendamentos } from "hooks/useFetchAgendamentos";
import { useFetchTerapeutas } from "hooks/useFetchTerapeutas";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "sonner";
import { AgendaSemSala } from "components/Agendamento/AgendaSemSala";

// Tipo de visualização
type ViewMode = "semanal" | "mensal" | "terapeuta";

// Período de visualização
type PeriodMode = "semana" | "mes" | "personalizado";

export default function Agenda() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("semanal");
  const [periodMode, setPeriodMode] = useState<PeriodMode>("semana");
  const [selectedTerapeuta, setSelectedTerapeuta] = useState("Todos");
  const [searchPaciente, setSearchPaciente] = useState("");
  const [customPeriodStart, setCustomPeriodStart] = useState<Date | null>(null);
  const [customPeriodEnd, setCustomPeriodEnd] = useState<Date | null>(null);
  const [chosedRoom, setChosedRoom] = useState({
    salaVerde: true,
    salaAzul: true,
  });
  const [selectedStatus, setSelectedStatus] = useState({
    confirmado: true,
    remarcado: true,
    cancelado: true,
  });

  // Modais
  const [isNewAgendamentoOpen, setIsNewAgendamentoOpen] = useState(false);
  const [newAgendamentoDate, setNewAgendamentoDate] = useState<Date | null>(
    null,
  );
  const [_openedFromDayClick, setOpenedFromDayClick] = useState(false);
  const [agendamentoEditando, setAgendamentoEditando] =
    useState<Agendamento | null>(null);
  const [agendamentoDeletando, setAgendamentoDeletando] =
    useState<Agendamento | null>(null);
  const [showLegend, setShowLegend] = useState(false);

  // Estado para drag and drop
  const [draggedAgendamento, setDraggedAgendamento] =
    useState<Agendamento | null>(null);
  const [dragOverDate, setDragOverDate] = useState<Date | null>(null);

  // Fetch data
  const { agendamentos, isLoading, isError, mutate, updateAgendamento } =
    useFetchAgendamentos();
  const { terapeutas } = useFetchTerapeutas();

  // Obter o início da semana da data selecionada
  const startOfSelectedWeek = startOfWeek(selectedDate, { weekStartsOn: 0 });

  // Obter todos os dias da semana
  const daysOfWeek = Array.from({ length: 7 }).map((_, index) =>
    addDays(startOfSelectedWeek, index),
  );

  // Obter todos os dias do mês (para visualização mensal)
  const getDaysInMonth = (date: Date) => {
    const start = startOfWeek(startOfMonth(date), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(date), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  };

  const daysOfMonth = getDaysInMonth(selectedDate);

  // Ordenar agendamentos por horário
  const sortByTime = (a: Agendamento, b: Agendamento) => {
    return a.horarioAgendamento.localeCompare(b.horarioAgendamento);
  };

  // Lista de terapeutas disponíveis
  const availableTerapeutas = useMemo(() => {
    if (!terapeutas) return [{ id: "Todos", nome: "Todos" }];

    return [
      { id: "Todos", nome: "Todos" },
      ...terapeutas.map((terapeuta) => ({
        id: terapeuta.id,
        nome: terapeuta.nome,
      })),
    ];
  }, [terapeutas]);

  // Filtrar agendamentos que precisam de sala
  const filteredAgendamentos = useMemo(() => {
    if (!agendamentos) return [];

    return agendamentos.filter((agendamento) => {
      // Verificar período selecionado
      const agendamentoDate = new Date(agendamento.dataAgendamento);

      let isInSelectedPeriod = false;
      if (periodMode === "semana") {
        isInSelectedPeriod = isSameWeek(agendamentoDate, selectedDate, {
          weekStartsOn: 0,
        });
      } else if (periodMode === "mes") {
        isInSelectedPeriod = isSameMonth(agendamentoDate, selectedDate);
      } else if (
        periodMode === "personalizado" &&
        customPeriodStart &&
        customPeriodEnd
      ) {
        isInSelectedPeriod =
          agendamentoDate >= customPeriodStart &&
          agendamentoDate <= customPeriodEnd;
      } else {
        isInSelectedPeriod = true; // Se não há período definido, mostrar todos
      }

      // Verificar terapeuta
      const isTerapeutaMatch =
        selectedTerapeuta === "Todos" ||
        agendamento.terapeuta_id === selectedTerapeuta;

      // Verificar sala
      const isSalaMatch =
        (agendamento.localAgendamento === "Sala Verde" &&
          chosedRoom.salaVerde) ||
        (agendamento.localAgendamento === "Sala Azul" && chosedRoom.salaAzul);

      const needsRoom =
        agendamento.localAgendamento === "Sala Verde" ||
        agendamento.localAgendamento === "Sala Azul";

      // Verificar status
      const isStatusMatch =
        (selectedStatus.confirmado &&
          agendamento.statusAgendamento === "Confirmado") ||
        (selectedStatus.remarcado &&
          agendamento.statusAgendamento === "Remarcado") ||
        (selectedStatus.cancelado &&
          agendamento.statusAgendamento === "Cancelado");

      // Verificar busca por paciente (se houver)
      const matchesPacienteSearch =
        searchPaciente === "" ||
        agendamento.pacienteInfo?.nome
          .toLowerCase()
          .includes(searchPaciente.toLowerCase());

      return (
        isInSelectedPeriod &&
        isTerapeutaMatch &&
        needsRoom &&
        isSalaMatch &&
        isStatusMatch &&
        matchesPacienteSearch
      );
    });
  }, [
    agendamentos,
    selectedDate,
    selectedTerapeuta,
    chosedRoom,
    selectedStatus,
    searchPaciente,
    periodMode,
    customPeriodStart,
    customPeriodEnd,
  ]);

  // Filtrar agendamentos que não precisam de sala
  const filteredAgendamentosNoRoom = useMemo(() => {
    if (!agendamentos) return [];

    return agendamentos.filter((agendamento) => {
      const agendamentoDate = new Date(agendamento.dataAgendamento);

      let isInSelectedPeriod = false;
      if (periodMode === "semana") {
        isInSelectedPeriod = isSameWeek(agendamentoDate, selectedDate, {
          weekStartsOn: 0,
        });
      } else if (periodMode === "mes") {
        isInSelectedPeriod = isSameMonth(agendamentoDate, selectedDate);
      } else if (
        periodMode === "personalizado" &&
        customPeriodStart &&
        customPeriodEnd
      ) {
        isInSelectedPeriod =
          agendamentoDate >= customPeriodStart &&
          agendamentoDate <= customPeriodEnd;
      } else {
        isInSelectedPeriod = true;
      }

      const isTerapeutaMatch =
        selectedTerapeuta === "Todos" ||
        agendamento.terapeuta_id === selectedTerapeuta;

      const isNoRoom = agendamento.localAgendamento === "Não Precisa de Sala";

      const isStatusMatch =
        (selectedStatus.confirmado &&
          agendamento.statusAgendamento === "Confirmado") ||
        (selectedStatus.remarcado &&
          agendamento.statusAgendamento === "Remarcado") ||
        (selectedStatus.cancelado &&
          agendamento.statusAgendamento === "Cancelado");

      // Verificar busca por paciente (se houver)
      const matchesPacienteSearch =
        searchPaciente === "" ||
        agendamento.pacienteInfo?.nome
          .toLowerCase()
          .includes(searchPaciente.toLowerCase());

      return (
        isInSelectedPeriod &&
        isTerapeutaMatch &&
        isNoRoom &&
        isStatusMatch &&
        matchesPacienteSearch
      );
    });
  }, [
    agendamentos,
    selectedDate,
    selectedTerapeuta,
    selectedStatus,
    searchPaciente,
    periodMode,
    customPeriodStart,
    customPeriodEnd,
  ]);

  // Agrupamento de agendamentos por terapeuta (para visualização por terapeuta)
  const agendamentosPorTerapeuta = useMemo(() => {
    if (!agendamentos || !terapeutas) return [];

    // Primeiro, filtrar agendamentos conforme critérios atuais (exceto pelo terapeuta específico)
    const agendamentosFiltrados = agendamentos.filter((agendamento) => {
      const agendamentoDate = new Date(agendamento.dataAgendamento);

      let isInSelectedPeriod = false;
      if (periodMode === "semana") {
        isInSelectedPeriod = isSameWeek(agendamentoDate, selectedDate, {
          weekStartsOn: 0,
        });
      } else if (periodMode === "mes") {
        isInSelectedPeriod = isSameMonth(agendamentoDate, selectedDate);
      } else if (
        periodMode === "personalizado" &&
        customPeriodStart &&
        customPeriodEnd
      ) {
        isInSelectedPeriod =
          agendamentoDate >= customPeriodStart &&
          agendamentoDate <= customPeriodEnd;
      } else {
        isInSelectedPeriod = true;
      }

      const isStatusMatch =
        (selectedStatus.confirmado &&
          agendamento.statusAgendamento === "Confirmado") ||
        (selectedStatus.remarcado &&
          agendamento.statusAgendamento === "Remarcado") ||
        (selectedStatus.cancelado &&
          agendamento.statusAgendamento === "Cancelado");

      const matchesPacienteSearch =
        searchPaciente === "" ||
        agendamento.pacienteInfo?.nome
          .toLowerCase()
          .includes(searchPaciente.toLowerCase());

      return isInSelectedPeriod && isStatusMatch && matchesPacienteSearch;
    });

    // Agrupar por terapeuta
    const agendamentosAgrupados: {
      terapeuta: Terapeuta;
      agendamentos: Agendamento[];
    }[] = [];

    // Se selecionou "Todos", mostrar para cada terapeuta
    if (selectedTerapeuta === "Todos") {
      terapeutas.forEach((terapeuta) => {
        const agendamentosDoTerapeuta = agendamentosFiltrados
          .filter((a) => a.terapeuta_id === terapeuta.id)
          .sort((a, b) => {
            // Ordenar primeiramente por data e depois por horário
            const dataA = new Date(a.dataAgendamento).getTime();
            const dataB = new Date(b.dataAgendamento).getTime();
            if (dataA !== dataB) return dataA - dataB;
            return a.horarioAgendamento.localeCompare(b.horarioAgendamento);
          });

        if (agendamentosDoTerapeuta.length > 0) {
          agendamentosAgrupados.push({
            terapeuta,
            agendamentos: agendamentosDoTerapeuta,
          });
        }
      });
    }
    // Caso contrário, mostrar apenas para o terapeuta selecionado
    else {
      const terapeuta = terapeutas.find((t) => t.id === selectedTerapeuta);
      if (terapeuta) {
        const agendamentosDoTerapeuta = agendamentosFiltrados
          .filter((a) => a.terapeuta_id === terapeuta.id)
          .sort((a, b) => {
            const dataA = new Date(a.dataAgendamento).getTime();
            const dataB = new Date(b.dataAgendamento).getTime();
            if (dataA !== dataB) return dataA - dataB;
            return a.horarioAgendamento.localeCompare(b.horarioAgendamento);
          });

        if (agendamentosDoTerapeuta.length > 0) {
          agendamentosAgrupados.push({
            terapeuta,
            agendamentos: agendamentosDoTerapeuta,
          });
        }
      }
    }

    return agendamentosAgrupados;
  }, [
    agendamentos,
    terapeutas,
    selectedDate,
    periodMode,
    customPeriodStart,
    customPeriodEnd,
    selectedStatus,
    searchPaciente,
    selectedTerapeuta,
  ]);

  // Estatísticas de agendamentos
  const estatisticasAgendamentos = useMemo(() => {
    if (!agendamentos)
      return {
        totalAgendamentos: 0,
        confirmados: 0,
        remarcados: 0,
        cancelados: 0,
        ocupacaoSalaVerde: 0,
        ocupacaoSalaAzul: 0,
      };

    // Filtrar apenas pelo período atual (semana ou mês)
    const agendamentosPeriodo = agendamentos.filter((agendamento) => {
      const agendamentoDate = new Date(agendamento.dataAgendamento);
      if (periodMode === "semana") {
        return isSameWeek(agendamentoDate, selectedDate, { weekStartsOn: 0 });
      } else if (periodMode === "mes") {
        return isSameMonth(agendamentoDate, selectedDate);
      } else if (
        periodMode === "personalizado" &&
        customPeriodStart &&
        customPeriodEnd
      ) {
        return (
          agendamentoDate >= customPeriodStart &&
          agendamentoDate <= customPeriodEnd
        );
      }
      return true;
    });

    // Contadores
    const confirmados = agendamentosPeriodo.filter(
      (a) => a.statusAgendamento === "Confirmado",
    ).length;
    const remarcados = agendamentosPeriodo.filter(
      (a) => a.statusAgendamento === "Remarcado",
    ).length;
    const cancelados = agendamentosPeriodo.filter(
      (a) => a.statusAgendamento === "Cancelado",
    ).length;

    // Ocupação das salas
    const salaVerde = agendamentosPeriodo.filter(
      (a) => a.localAgendamento === "Sala Verde",
    ).length;
    const salaAzul = agendamentosPeriodo.filter(
      (a) => a.localAgendamento === "Sala Azul",
    ).length;

    return {
      totalAgendamentos: agendamentosPeriodo.length,
      confirmados,
      remarcados,
      cancelados,
      ocupacaoSalaVerde: salaVerde,
      ocupacaoSalaAzul: salaAzul,
    };
  }, [
    agendamentos,
    selectedDate,
    periodMode,
    customPeriodStart,
    customPeriodEnd,
  ]);

  // Handlers para alternância de visualização
  const handleSetWeeklyView = () => {
    setViewMode("semanal");
    setPeriodMode("semana");
  };

  const handleSetMonthlyView = () => {
    setViewMode("mensal");
    setPeriodMode("mes");
  };

  const handleSetTerapeutaView = () => {
    setViewMode("terapeuta");
    // O período permanece como está
  };

  // Handlers para filtros de sala
  const handleRoomChange = (room: "salaVerde" | "salaAzul") => {
    setChosedRoom((prev) => ({
      ...prev,
      [room]: !prev[room],
    }));
  };

  // Handlers para filtros de status
  const handleStatusChange = (
    status: "confirmado" | "remarcado" | "cancelado",
  ) => {
    setSelectedStatus((prev) => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  // Navegação entre períodos
  const handlePrevious = () => {
    if (periodMode === "semana") {
      setSelectedDate(subWeeks(selectedDate, 1));
    } else if (periodMode === "mes") {
      setSelectedDate(subMonths(selectedDate, 1));
    } else if (
      periodMode === "personalizado" &&
      customPeriodStart &&
      customPeriodEnd
    ) {
      // Para períodos personalizados, podemos move-los em uma semana
      const diff = customPeriodEnd.getTime() - customPeriodStart.getTime();
      const newStart = new Date(customPeriodStart.getTime() - diff);
      const newEnd = new Date(customPeriodEnd.getTime() - diff);
      setCustomPeriodStart(newStart);
      setCustomPeriodEnd(newEnd);
    }
  };

  const handleNext = () => {
    if (periodMode === "semana") {
      setSelectedDate(addWeeks(selectedDate, 1));
    } else if (periodMode === "mes") {
      setSelectedDate(addMonths(selectedDate, 1));
    } else if (
      periodMode === "personalizado" &&
      customPeriodStart &&
      customPeriodEnd
    ) {
      // Para períodos personalizados, podemos move-los em uma semana
      const diff = customPeriodEnd.getTime() - customPeriodStart.getTime();
      const newStart = new Date(customPeriodStart.getTime() + diff);
      const newEnd = new Date(customPeriodEnd.getTime() + diff);
      setCustomPeriodStart(newStart);
      setCustomPeriodEnd(newEnd);
    }
  };

  // Configurar período personalizado
  const handleSetCustomPeriod = () => {
    setPeriodMode("personalizado");
    // Se não existir período personalizado, criar um de 3 dias a partir da data selecionada
    if (!customPeriodStart || !customPeriodEnd) {
      setCustomPeriodStart(selectedDate);
      setCustomPeriodEnd(addDays(selectedDate, 3));
    }
  };

  // Handlers para ações de agendamento
  const handleEditAgendamento = (agendamento: Agendamento) => {
    setAgendamentoEditando(agendamento);
  };

  const handleDeleteClick = (agendamento: Agendamento) => {
    setAgendamentoDeletando(agendamento);
  };

  const handleEditSuccess = () => {
    // Recarregar dados após edição
    mutate();
    setAgendamentoEditando(null);
    toast.success("Agendamento atualizado com sucesso!");
  };

  const handleDeleteSuccess = (isRecorrente: boolean) => {
    // Recarregar dados após exclusão
    mutate();
    setAgendamentoDeletando(null);

    // Mensagem específica dependendo se é exclusão recorrente ou não
    if (isRecorrente) {
      toast.success(
        "Todos os agendamentos recorrentes foram excluídos com sucesso!",
      );
    } else {
      toast.success("Agendamento excluído com sucesso!");
    }
  };

  // Handlers para drag and drop (remarcação rápida)
  const handleDragStart = (agendamento: Agendamento) => {
    setDraggedAgendamento(agendamento);
  };

  const handleDragOver = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    setDragOverDate(date);
  };

  const handleDrop = async (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    if (!draggedAgendamento) return;

    try {
      // Formatar a data para o formato esperado pela API (YYYY-MM-DD)
      const formattedDate = format(date, "yyyy-MM-dd");

      // Criar cópia do agendamento com nova data e status "Remarcado"
      const updatedAgendamento = {
        ...draggedAgendamento,
        dataAgendamento: formattedDate,
        statusAgendamento: "Remarcado" as
          | "Confirmado"
          | "Remarcado"
          | "Cancelado",
      };

      // Chamar a função do hook para atualizar o agendamento
      await updateAgendamento(draggedAgendamento.id, updatedAgendamento);

      toast.success("Agendamento remarcado com sucesso!");

      // Recarregar dados após remarcação
      mutate();
    } catch (error) {
      console.error("Erro ao remarcar agendamento:", error);
      toast.error("Erro ao remarcar agendamento");
    } finally {
      // Limpar estados de drag and drop
      setDraggedAgendamento(null);
      setDragOverDate(null);
    }
  };

  // Open new agendamento modal on day click
  const handleDayClick = (date: Date) => {
    setNewAgendamentoDate(date);
    setOpenedFromDayClick(true);
    setIsNewAgendamentoOpen(true);
  };

  // Mostrar estado de carregamento
  if (isLoading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-azul"></div>
        <span className="ml-4 text-xl">Carregando agendamentos...</span>
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
        <title>Agenda</title>
      </Head>

      <main className="flex-1 bg-gray-100 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Agenda</h1>
          <Dialog.Root
            open={isNewAgendamentoOpen}
            onOpenChange={setIsNewAgendamentoOpen}
          >
            <Dialog.Trigger asChild>
              <button
                type="button"
                className="flex items-center bg-azul text-white px-4 py-2 rounded hover:bg-sky-600 duration-150"
                onClick={() => {
                  setNewAgendamentoDate(null);
                  setOpenedFromDayClick(false);
                }}
              >
                <Plus size={20} weight="bold" className="mr-2" />
                Novo Agendamento
              </button>
            </Dialog.Trigger>
            {isNewAgendamentoOpen && (
              <NovoAgendamentoModal
                initialDate={newAgendamentoDate || undefined}
                onSuccess={() => {
                  mutate();
                  setIsNewAgendamentoOpen(false);
                  toast.success("Agendamento criado com sucesso!");
                }}
                onClose={() => {
                  setIsNewAgendamentoOpen(false);
                  setOpenedFromDayClick(false);
                }}
              />
            )}
          </Dialog.Root>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="flex items-center space-x-4 p-4 bg-white rounded shadow">
            <CalendarCheck size={24} className="text-green-500" />
            <div>
              <h3 className="text-xs uppercase text-gray-500">Agendamentos</h3>
              <span className="text-xl font-semibold">
                {estatisticasAgendamentos.totalAgendamentos}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-4 bg-white rounded shadow">
            <Users size={24} className="text-blue-500" />
            <div>
              <h3 className="text-xs uppercase text-gray-500">Confirmados</h3>
              <span className="text-xl font-semibold">
                {estatisticasAgendamentos.confirmados}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-4 bg-white rounded shadow">
            <Calendar size={24} className="text-amber-500" />
            <div>
              <h3 className="text-xs uppercase text-gray-500">Remarcados</h3>
              <span className="text-xl font-semibold">
                {estatisticasAgendamentos.remarcados}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-4 bg-white rounded shadow">
            <CalendarX size={24} className="text-red-500" />
            <div>
              <h3 className="text-xs uppercase text-gray-500">Cancelados</h3>
              <span className="text-xl font-semibold">
                {estatisticasAgendamentos.cancelados}
              </span>
            </div>
          </div>

          <div className="flex items-center p-4 bg-white rounded shadow justify-between">
            <div className="flex items-center">
              <Door size={24} className="text-purple-500 mr-2" />
              <div>
                <h3 className="text-xs uppercase text-gray-500">Ocupação</h3>
                <div className="flex space-x-4">
                  <span className="text-green-600 font-medium">
                    Sala Verde: {estatisticasAgendamentos.ocupacaoSalaVerde}
                  </span>
                  <span className="text-blue-600 font-medium">
                    Sala Azul: {estatisticasAgendamentos.ocupacaoSalaAzul}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowLegend(!showLegend)}
              className="text-gray-500 hover:text-gray-700 ml-2"
              aria-label="Mostrar legenda"
              title="Mostrar legenda"
            >
              <Info size={20} />
            </button>
          </div>
        </div>

        {/* Legenda (mostrada apenas quando o botão é clicado) */}
        {showLegend && (
          <div className="bg-white p-4 rounded shadow mb-6">
            <h3 className="font-medium mb-2">Legenda:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="text-sm font-medium">Status:</h4>
                <div className="flex items-center mt-1">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-sm">Confirmado</span>
                </div>
                <div className="flex items-center mt-1">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                  <span className="text-sm">Cancelado</span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium">Salas:</h4>
                <div className="flex items-center mt-1">
                  <div className="w-3 h-3 rounded-sm bg-green-500 mr-2"></div>
                  <span className="text-sm">Sala Verde</span>
                </div>
                <div className="flex items-center mt-1">
                  <div className="w-3 h-3 rounded-sm bg-blue-500 mr-2"></div>
                  <span className="text-sm">Sala Azul</span>
                </div>
                <div className="flex items-center mt-1">
                  <div className="w-3 h-3 rounded-sm bg-yellow-400 mr-2"></div>
                  <span className="text-sm">Não Precisa de Sala</span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium">Dicas:</h4>
                <div className="text-sm mt-1">
                  • Clique no agendamento para editar
                </div>
                <div className="text-sm mt-1">
                  • Arraste para remarcar rapidamente
                </div>
                <div className="text-sm mt-1">
                  • Use filtros para encontrar agendamentos específicos
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Botões de alternância de visualização */}
        <div className="flex space-x-4 mb-4">
          <button
            type="button"
            onClick={handleSetWeeklyView}
            className={`px-4 py-2 rounded ${
              viewMode === "semanal"
                ? "bg-azul text-white"
                : "bg-white text-azul"
            }`}
          >
            Semanal
          </button>
          <button
            type="button"
            onClick={handleSetMonthlyView}
            className={`px-4 py-2 rounded ${
              viewMode === "mensal"
                ? "bg-azul text-white"
                : "bg-white text-azul"
            }`}
          >
            Mensal
          </button>
          <button
            type="button"
            onClick={handleSetTerapeutaView}
            className={`px-4 py-2 rounded ${
              viewMode === "terapeuta"
                ? "bg-azul text-white"
                : "bg-white text-azul"
            }`}
          >
            Por Terapeuta
          </button>
          <button
            type="button"
            onClick={handleSetCustomPeriod}
            className={`px-4 py-2 rounded ${
              periodMode === "personalizado"
                ? "bg-azul text-white"
                : "bg-white text-azul"
            }`}
          >
            Período Personalizado
          </button>
        </div>

        {/* Período personalizado (só aparece quando selecionado) */}
        {periodMode === "personalizado" && (
          <div className="flex items-center space-x-4 p-4 bg-white rounded shadow mb-4">
            <span className="text-sm font-medium">Período:</span>
            <DatePicker
              selectsRange
              startDate={customPeriodStart}
              endDate={customPeriodEnd}
              onChange={(dates: [Date | null, Date | null]) => {
                setCustomPeriodStart(dates[0]);
                setCustomPeriodEnd(dates[1]);
              }}
              className="border p-2 rounded"
              dateFormat="dd/MM/yyyy"
              placeholderText="Selecione o período"
            />
          </div>
        )}

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Filtro por Terapeuta */}
          <div className="flex items-center space-x-4 p-4 bg-white rounded shadow">
            <User size={24} className="text-gray-500" />
            <label
              htmlFor="terapeutas"
              className="text-md font-medium text-gray-700"
            >
              Terapeuta
            </label>
            <select
              className="text-md w-full focus:outline-none"
              name="terapeutas"
              id="terapeutas"
              value={selectedTerapeuta}
              onChange={(e) => setSelectedTerapeuta(e.target.value)}
            >
              {availableTerapeutas.map((terapeuta) => (
                <option key={terapeuta.id} value={terapeuta.id}>
                  {terapeuta.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Busca por Paciente */}
          <div className="flex items-center p-4 bg-white rounded shadow">
            <MagnifyingGlass
              size={24}
              className="text-gray-500 mr-3 flex-shrink-0"
            />
            <label
              htmlFor="searchPaciente"
              className="text-md font-medium text-gray-700 mr-3"
            >
              Paciente:
            </label>
            <input
              type="text"
              id="searchPaciente"
              className="w-full focus:outline-none"
              placeholder="Buscar por nome"
              value={searchPaciente}
              onChange={(e) => setSearchPaciente(e.target.value)}
            />
          </div>

          {/* Filtro por Sala */}
          <div className="flex items-center p-4 bg-white rounded shadow">
            <Door size={24} className="text-gray-500 mr-3 flex-shrink-0" />
            <label
              htmlFor="localAgendamento"
              className="text-md font-medium text-gray-700 mr-3"
            >
              Sala:
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 text-azul mr-2"
                  checked={chosedRoom.salaVerde}
                  onChange={() => handleRoomChange("salaVerde")}
                />
                <span>Sala Verde</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 text-azul mr-2"
                  checked={chosedRoom.salaAzul}
                  onChange={() => handleRoomChange("salaAzul")}
                />
                <span>Sala Azul</span>
              </label>
            </div>
          </div>

          {/* Filtro por Status */}
          <div className="bg-white rounded shadow flex items-center">
            <div className="flex items-center p-4">
              <CalendarCheck size={24} className="text-gray-500 mr-3" />
              <label
                htmlFor="statusAgendamento"
                className="text-md font-medium text-gray-700"
              >
                Status:
              </label>
            </div>
            <div className="flex space-x-2 p-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 text-green-500 mr-2"
                  checked={selectedStatus.confirmado}
                  onChange={() => handleStatusChange("confirmado")}
                />
                <span>Confirmado</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 text-yellow-500 mr-2"
                  checked={selectedStatus.remarcado}
                  onChange={() => handleStatusChange("remarcado")}
                />
                <span>Remarcado</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 text-red-500 mr-2"
                  checked={selectedStatus.cancelado}
                  onChange={() => handleStatusChange("cancelado")}
                />
                <span>Cancelado</span>
              </label>
            </div>
          </div>
        </div>

        {/* Navegação da Semana/Mês */}
        <div className="flex items-center justify-between p-4 bg-white rounded shadow mb-4">
          <button
            type="button"
            aria-label="Anterior"
            onClick={handlePrevious}
            className="hover:bg-gray-100 p-2 rounded-full transition-colors"
          >
            <CaretLeft size={24} weight="fill" />
          </button>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-semibold">
              {periodMode === "semana"
                ? `${format(selectedDate, "MMMM", { locale: ptBR }).replace(/^\w/, (c) => c.toUpperCase())} - Semana de ${format(startOfSelectedWeek, "dd/MM/yyyy")} até ${format(addDays(startOfSelectedWeek, 6), "dd/MM/yyyy")}`
                : periodMode === "mes"
                  ? format(selectedDate, "MMMM yyyy", { locale: ptBR }).replace(
                      /^\w/,
                      (c) => c.toUpperCase(),
                    )
                  : `Período personalizado: ${customPeriodStart ? format(customPeriodStart, "dd/MM/yyyy") : ""} até ${customPeriodEnd ? format(customPeriodEnd, "dd/MM/yyyy") : ""}`}
            </h2>
            <DatePicker
              selected={selectedDate}
              onChange={(date: Date) => setSelectedDate(date)}
              customInput={
                <button type="button" className="hover:bg-gray-100 p-1 rounded">
                  <Calendar size={20} />
                </button>
              }
            />
          </div>
          <button
            type="button"
            aria-label="Próximo"
            onClick={handleNext}
            className="hover:bg-gray-100 p-2 rounded-full transition-colors"
          >
            <CaretRight size={24} weight="fill" />
          </button>
        </div>

        {/* Conteúdo baseado na visualização */}
        {viewMode === "semanal" && (
          <AgendaSemanal
            daysOfWeek={daysOfWeek}
            agendamentos={filteredAgendamentos}
            sortByTime={sortByTime}
            handleEditAgendamento={handleEditAgendamento}
            handleDeleteClick={handleDeleteClick}
            handleDragStart={handleDragStart}
            handleDragOver={handleDragOver}
            handleDrop={handleDrop}
            dragOverDate={dragOverDate}
            onDayClick={handleDayClick}
          />
        )}

        {viewMode === "mensal" && (
          <AgendaMensal
            daysOfMonth={daysOfMonth}
            selectedDate={selectedDate}
            agendamentos={filteredAgendamentos}
            sortByTime={sortByTime}
            handleEditAgendamento={handleEditAgendamento}
            handleDeleteClick={handleDeleteClick}
            handleDragStart={handleDragStart}
            handleDragOver={handleDragOver}
            handleDrop={handleDrop}
            dragOverDate={dragOverDate}
            onDayClick={handleDayClick}
          />
        )}

        {viewMode === "terapeuta" && (
          <AgendaPorTerapeuta
            agendamentosPorTerapeuta={agendamentosPorTerapeuta}
            handleEditAgendamento={handleEditAgendamento}
            handleDeleteClick={handleDeleteClick}
          />
        )}

        {periodMode === "personalizado" && (
          <AgendaPeriodoPersonalizado
            daysOfPeriod={
              customPeriodStart && customPeriodEnd
                ? Array.from({
                    length:
                      Math.ceil(
                        (customPeriodEnd.getTime() -
                          customPeriodStart.getTime()) /
                          (1000 * 60 * 60 * 24),
                      ) + 1,
                  }).map(
                    (_, i) =>
                      new Date(
                        customPeriodStart.getTime() + i * 24 * 60 * 60 * 1000,
                      ),
                  )
                : []
            }
            agendamentos={filteredAgendamentos}
            sortByTime={sortByTime}
            handleEditAgendamento={handleEditAgendamento}
            handleDeleteClick={handleDeleteClick}
            handleDragStart={handleDragStart}
            handleDragOver={handleDragOver}
            handleDrop={handleDrop}
            dragOverDate={dragOverDate}
          />
        )}

        {/* Agendamentos sem sala */}
        <AgendaSemSala
          agendamentos={filteredAgendamentosNoRoom}
          sortByTime={sortByTime}
          handleEditAgendamento={handleEditAgendamento}
          handleDeleteClick={handleDeleteClick}
          handleDragStart={handleDragStart}
        />

        {/* Modais */}
        {agendamentoEditando && (
          <EditarAgendamentoModal
            agendamento={agendamentoEditando}
            open={!!agendamentoEditando}
            onClose={() => setAgendamentoEditando(null)}
            onSuccess={handleEditSuccess}
          />
        )}

        {agendamentoDeletando && (
          <DeletarAgendamentoModal
            agendamento={agendamentoDeletando}
            open={!!agendamentoDeletando}
            onClose={() => setAgendamentoDeletando(null)}
            onSuccess={handleDeleteSuccess}
          />
        )}
      </main>
    </div>
  );
}
