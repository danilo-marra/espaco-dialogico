import {
  CalendarCheck,
  Calendar,
  PencilSimple,
  Plus,
  Receipt,
  TrashSimple,
  Users,
  CaretLeft,
  CaretRight,
  User,
  ChartPie,
  MagnifyingGlass,
  Info,
} from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import Pagination from "components/Pagination";
import { NovaSessaoModal } from "components/Sessoes/NovaSessaoModal";
import { EditarSessaoModal } from "components/Sessoes/EditarSessaoModal";
import { DeletarSessaoModal } from "components/Sessoes/DeletarSessaoModal";
import Head from "next/head";
import React, { useMemo, useState } from "react";
import { Sessao } from "tipos";
import { dateFormatter } from "utils/formatter";
import { useFetchSessoes } from "hooks/useFetchSessoes";
import { useFetchTerapeutas } from "hooks/useFetchTerapeutas";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "sonner";
import {
  format,
  addMonths,
  isSameMonth,
  isAfter,
  isBefore,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { ptBR } from "date-fns/locale";

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

const SESSOES_PER_PAGE = 10;

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

  // Definir o início e fim do mês selecionado
  const inicioMes = startOfMonth(selectedMonth);
  const fimMes = endOfMonth(selectedMonth);

  // Ordenamos as sessões (do mais recente para o mais antigo)
  return sessoes
    .slice() // Copia o array para não modificar o original
    .sort((a, b) => {
      // Ordenando por data da primeira sessão (se existir)
      const dateA = a.dtSessao1 ? new Date(a.dtSessao1).getTime() : 0;
      const dateB = b.dtSessao1 ? new Date(b.dtSessao1).getTime() : 0;
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

      // Filtrar por mês selecionado (verificando todas as datas possíveis de sessão)
      let matchesMonth = false;

      // Verifica se alguma das datas de sessão está dentro do mês selecionado
      const datasParaVerificar = [
        sessao.dtSessao1,
        sessao.dtSessao2,
        sessao.dtSessao3,
        sessao.dtSessao4,
        sessao.dtSessao5,
        sessao.dtSessao6,
      ];

      for (const dataSessao of datasParaVerificar) {
        if (dataSessao) {
          const data = new Date(dataSessao);
          if (!isNaN(data.getTime())) {
            if (
              (isAfter(data, inicioMes) && isBefore(data, fimMes)) ||
              isSameMonth(data, selectedMonth)
            ) {
              matchesMonth = true;
              break;
            }
          }
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

  // Definir o início e fim do mês selecionado
  const inicioMes = startOfMonth(selectedMonth);
  const fimMes = endOfMonth(selectedMonth);

  return sessoes.filter((sessao) => {
    // Verifica se alguma das datas de sessão está dentro do mês selecionado
    const datasParaVerificar = [
      sessao.dtSessao1,
      sessao.dtSessao2,
      sessao.dtSessao3,
      sessao.dtSessao4,
      sessao.dtSessao5,
      sessao.dtSessao6,
    ];

    for (const dataSessao of datasParaVerificar) {
      if (dataSessao) {
        const data = new Date(dataSessao);
        if (!isNaN(data.getTime())) {
          if (
            (isAfter(data, inicioMes) && isBefore(data, fimMes)) ||
            isSameMonth(data, selectedMonth)
          ) {
            return true;
          }
        }
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
    typeof dtEntrada === "string" ? new Date(dtEntrada) : dtEntrada;

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

export default function Sessoes() {
  // Utilizar hooks do Redux
  const { sessoes, isLoading, isError, mutate } = useFetchSessoes();
  const { terapeutas } = useFetchTerapeutas();

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTerapeuta, setSelectedTerapeuta] = useState("Todos");
  const [selectedStatus, setSelectedStatus] = useState("Todos");
  const [selectedTipo, setSelectedTipo] = useState("Todos");
  const [searchPaciente, setSearchPaciente] = useState("");
  const [showLegend, setShowLegend] = useState(false);

  const [editingSessao, setEditingSessao] = useState<Sessao | null>(null);
  const [deletingSessao, setDeletingSessao] = useState<Sessao | null>(null);
  const [isNewSessaoOpen, setIsNewSessaoOpen] = useState(false);

  const [currentDate, setCurrentDate] = useState(new Date());

  // Função para formatar data com segurança
  const formatSafeDate = (dateValue) => {
    if (!dateValue) return "-";

    try {
      const date = new Date(dateValue);
      // Verifica se a data é válida
      if (isNaN(date.getTime())) {
        return "Data inválida";
      }
      return dateFormatter.format(date);
    } catch (error) {
      return "Data inválida";
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

  // Paginação - com segurança
  const paginatedSessoes = useMemo(() => {
    const startIndex = (currentPage - 1) * SESSOES_PER_PAGE;
    return filteredSessoes.slice(startIndex, startIndex + SESSOES_PER_PAGE);
  }, [filteredSessoes, currentPage]);

  // Faturamento total das sessões filtradas - com segurança
  const faturamentoSessoesFiltradas = useMemo(() => {
    return filteredSessoes.reduce(
      (total, sessao) => total + (sessao.valorSessao || 0),
      0,
    );
  }, [filteredSessoes]);

  // Calcular valor de repasse aos terapeutas para as sessões filtradas - com segurança
  const valorRepasseTerapeutas = useMemo(() => {
    return filteredSessoes.reduce((total, sessao) => {
      // Verificar se temos as informações do terapeuta
      if (!sessao.terapeutaInfo || !sessao.terapeutaInfo.dt_entrada)
        return total;

      // Calcular o repasse para esta sessão específica
      const repasse = calcularRepasse(
        sessao.valorSessao,
        sessao.terapeutaInfo.dt_entrada,
      );
      return total + repasse;
    }, 0);
  }, [filteredSessoes]);

  // Calcular lucro da clínica (receita - repasse) apenas baseado no mês selecionado - com segurança
  const lucroDaClinica = useMemo(() => {
    if (!sessoes) return 0;

    // Filtrar sessões apenas pelo mês selecionado (ignorando outros filtros)
    const sessoesDoMes = filterSessoesByMonth(sessoes, currentDate);

    // Calcular faturamento total do mês
    const faturamentoTotalMes = sessoesDoMes.reduce(
      (total, sessao) => total + (sessao.valorSessao || 0),
      0,
    );

    // Calcular repasse total do mês
    const repasseTotalMes = sessoesDoMes.reduce((total, sessao) => {
      // Verificar se temos as informações do terapeuta
      if (!sessao.terapeutaInfo || !sessao.terapeutaInfo.dt_entrada)
        return total;

      // Calcular o repasse para esta sessão específica
      const repasse = calcularRepasse(
        sessao.valorSessao,
        sessao.terapeutaInfo.dt_entrada,
      );
      return total + repasse;
    }, 0);

    // Lucro = Faturamento - Repasse
    return faturamentoTotalMes - repasseTotalMes;
  }, [sessoes, currentDate]);

  const sessoesPendentes = useMemo(() => {
    if (!Array.isArray(sessoes)) return 0;

    // Filtrar pelo mês atual primeiro
    const sessoesMes = filterSessoesByMonth(sessoes, currentDate);

    // Depois filtrar por status pendente
    return sessoesMes.filter(
      (sessao) => sessao.statusSessao === "Pagamento Pendente",
    ).length;
  }, [sessoes, currentDate]); // Adicionado currentDate na dependência

  const totalPages = useMemo(() => {
    return Math.ceil(filteredSessoes.length / SESSOES_PER_PAGE);
  }, [filteredSessoes]);

  // Handlers
  const handleDateChange = (date: Date) => {
    setCurrentDate(date);
    setCurrentPage(1); // Reset para a primeira página ao mudar o mês
  };

  const handleMonthChange = (change: number) => {
    const newDate = addMonths(currentDate, change);
    setCurrentDate(newDate);
    setCurrentPage(1); // Reset para a primeira página ao mudar o mês
  };

  const handleEditSessao = (sessao: Sessao) => {
    setEditingSessao(sessao);
  };

  const handleEditSuccess = () => {
    // Recarregar dados após edição
    mutate();
    setEditingSessao(null);
    toast.success("Sessão atualizada com sucesso!");
  };

  const handleDeleteClick = (sessao: Sessao) => {
    setDeletingSessao(sessao);
  };

  const handleDeleteSuccess = () => {
    // Recarregar dados após exclusão
    mutate();
    setDeletingSessao(null);
    toast.success("Sessão excluída com sucesso!");
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
      <main className="flex-1 bg-gray-100 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Sessões</h1>
          <Dialog.Root open={isNewSessaoOpen} onOpenChange={setIsNewSessaoOpen}>
            <Dialog.Trigger asChild>
              <button
                type="button"
                className="flex items-center bg-azul text-white px-4 py-2 rounded hover:bg-sky-600 duration-150"
              >
                <Plus size={20} weight="bold" className="mr-2" />
                Nova Sessão
              </button>
            </Dialog.Trigger>
            {isNewSessaoOpen && (
              <NovaSessaoModal
                onSuccess={() => {
                  mutate();
                  setIsNewSessaoOpen(false);
                  toast.success("Sessão criada com sucesso!");
                }}
                onClose={() => setIsNewSessaoOpen(false)}
              />
            )}
          </Dialog.Root>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="flex items-center space-x-4 p-4 bg-white rounded shadow">
            <Receipt size={24} className="text-rosa" />
            <div>
              <h3 className="text-xs uppercase text-gray-500">
                Pagamentos Pendentes
              </h3>
              <span className="text-xl font-semibold">{sessoesPendentes}</span>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-4 bg-white rounded shadow">
            <CalendarCheck size={24} className="text-green-500" />
            <div>
              <h3 className="text-xs uppercase text-gray-500">
                Total de Sessões
              </h3>
              <span className="text-xl font-semibold">
                {filteredSessoes.length}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-4 bg-white rounded shadow">
            <Users size={24} className="text-purple-500" />
            <div>
              <h3 className="text-xs uppercase text-gray-500">
                Faturamento Filtrado
              </h3>
              <span className="text-xl font-semibold">
                R$ {faturamentoSessoesFiltradas.toFixed(2).replace(".", ",")}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-4 bg-white rounded shadow">
            <User size={24} className="text-blue-500" />
            <div>
              <h3 className="text-xs uppercase text-gray-500">
                Repasse Filtrado
              </h3>
              <span className="text-xl font-semibold">
                R$ {valorRepasseTerapeutas.toFixed(2).replace(".", ",")}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-4 bg-white rounded shadow justify-between">
            <div className="flex items-center">
              <ChartPie size={24} className="text-green-600 mr-2" />
              <div>
                <h3 className="text-xs uppercase text-gray-500">
                  Lucro Mensal
                </h3>
                <span className="text-md font-semibold">
                  R$ {lucroDaClinica.toFixed(2).replace(".", ",")}
                </span>
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
                <h4 className="text-sm font-medium">Dicas:</h4>
                <div className="text-sm mt-1">
                  • Clique no ícone de lápis para editar
                </div>
                <div className="text-sm mt-1">
                  • Use filtros para encontrar sessões específicas
                </div>
                <div className="text-sm mt-1">
                  • O repasse é calculado com base no tempo de casa do terapeuta
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Date Navigation */}
        <div className="flex items-center justify-between p-4 bg-white rounded shadow mb-4">
          <button
            type="button"
            onClick={() => handleMonthChange(-1)}
            aria-label="Previous month"
            className="hover:bg-gray-100 p-2 rounded-full transition-colors"
          >
            <CaretLeft size={24} weight="fill" />
          </button>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-semibold">
              {format(currentDate, "MMMM yyyy", { locale: ptBR }).replace(
                /^\w/,
                (c) => c.toUpperCase(),
              )}
            </h2>
            <DatePicker
              selected={currentDate}
              onChange={handleDateChange}
              showMonthYearPicker
              dateFormat="MMMM yyyy"
              locale={ptBR}
              customInput={
                <button
                  type="button"
                  aria-label="Select month and year"
                  className="hover:bg-gray-100 p-1 rounded-full transition-colors"
                >
                  <Calendar size={20} />
                </button>
              }
            />
          </div>
          <button
            type="button"
            onClick={() => handleMonthChange(1)}
            aria-label="Next month"
            className="hover:bg-gray-100 p-2 rounded-full transition-colors"
          >
            <CaretRight size={24} weight="fill" />
          </button>
        </div>

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
              onChange={(e) => {
                setSelectedTerapeuta(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="Todos">Todos</option>
              {terapeutas?.map((terapeuta) => (
                <option key={terapeuta.id} value={String(terapeuta.id)}>
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

          {/* Filtro por Status */}
          <div className="flex items-center p-4 bg-white rounded shadow">
            <Receipt size={24} className="text-gray-500 mr-3 flex-shrink-0" />
            <label
              htmlFor="status"
              className="text-md font-medium text-gray-700 whitespace-nowrap mr-3"
            >
              Status do Pagamento
            </label>
            <select
              className="text-md w-full focus:outline-none"
              name="status"
              id="status"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
            >
              {STATUS_SESSOES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Tipo */}
          <div className="flex items-center p-4 bg-white rounded shadow">
            <CalendarCheck
              size={24}
              className="text-gray-500 mr-3 flex-shrink-0"
            />
            <label
              htmlFor="tipo"
              className="text-md font-medium text-gray-700 whitespace-nowrap mr-3"
            >
              Tipo de Sessão
            </label>
            <select
              className="text-md w-full focus:outline-none"
              name="tipo"
              id="tipo"
              value={selectedTipo}
              onChange={(e) => {
                setSelectedTipo(e.target.value);
                setCurrentPage(1);
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

        {/* Tabela de Sessões */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-rosa text-white">
                <tr>
                  <th className="p-4 text-left">Terapeuta</th>
                  <th className="p-4 text-left">Paciente</th>
                  <th className="p-4 text-left">Tipo</th>
                  <th className="p-4 text-left">Valor da Sessão</th>
                  <th className="p-4 text-left">Repasse</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-left">Data</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedSessoes.length > 0 ? (
                  paginatedSessoes.map((sessao) => {
                    // Encontrar todas as datas válidas e dentro do mês selecionado
                    const datasValidas = [
                      sessao.dtSessao1,
                      sessao.dtSessao2,
                      sessao.dtSessao3,
                      sessao.dtSessao4,
                      sessao.dtSessao5,
                      sessao.dtSessao6,
                    ].filter((data) => {
                      if (!data) return false;
                      try {
                        const dataObj = new Date(data);
                        return (
                          !isNaN(dataObj.getTime()) &&
                          isSameMonth(dataObj, currentDate)
                        );
                      } catch (e) {
                        return false;
                      }
                    });

                    // Obter a primeira data válida para exibir como principal
                    const dataExibicao =
                      datasValidas.length > 0
                        ? formatSafeDate(datasValidas[0])
                        : formatSafeDate(sessao.dtSessao1); // caso não tenha data no mês atual

                    // Calcular o repasse e a porcentagem
                    let valorRepasse = obterValorRepasse(sessao);
                    let percentualRepasse = 0;

                    // Calcular o percentual com base no valor de repasse
                    if (sessao.valorSessao && sessao.valorSessao > 0) {
                      // Se há um valor de repasse personalizado, calcule o percentual real
                      if (
                        sessao.valorRepasse !== undefined &&
                        sessao.valorRepasse !== null
                      ) {
                        percentualRepasse = Math.round(
                          (Number(sessao.valorRepasse) / sessao.valorSessao) *
                            100,
                        );
                      } else if (sessao.terapeutaInfo?.dt_entrada) {
                        // Caso contrário, use a regra padrão (45% ou 50%)
                        const dataEntrada = new Date(
                          sessao.terapeutaInfo.dt_entrada,
                        );
                        if (!isNaN(dataEntrada.getTime())) {
                          const hoje = new Date();
                          const diferencaEmMilissegundos =
                            hoje.getTime() - dataEntrada.getTime();
                          const umAnoEmMilissegundos =
                            365.25 * 24 * 60 * 60 * 1000;
                          const anosNaClinica =
                            diferencaEmMilissegundos / umAnoEmMilissegundos;
                          percentualRepasse = anosNaClinica >= 1 ? 50 : 45;
                        }
                      } else {
                        // Fallback para 45%
                        percentualRepasse = 45;
                      }
                    }

                    return (
                      <tr key={sessao.id} className="hover:bg-gray-50">
                        <td className="p-4">
                          {sessao.terapeutaInfo?.nome || "Não atribuído"}
                        </td>
                        <td className="p-4">
                          {sessao.pacienteInfo?.nome || "Não atribuído"}
                        </td>
                        <td className="p-4">{sessao.tipoSessao}</td>
                        <td className="p-4">
                          R$ {sessao.valorSessao.toFixed(2).replace(".", ",")}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span>
                              R$ {valorRepasse.toFixed(2).replace(".", ",")}
                            </span>
                            <span className="text-xs text-gray-500">
                              {percentualRepasse}%
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${
                              sessao.statusSessao === "Pagamento Pendente"
                                ? "bg-yellow-100 text-yellow-700"
                                : sessao.statusSessao === "Pagamento Realizado"
                                  ? "bg-green-100 text-green-700"
                                  : sessao.statusSessao ===
                                      "Nota Fiscal Emitida"
                                    ? "bg-blue-100 text-blue-700"
                                    : sessao.statusSessao ===
                                        "Nota Fiscal Enviada"
                                      ? "bg-purple-100 text-purple-700"
                                      : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {sessao.statusSessao}
                          </span>
                        </td>
                        <td className="p-4">{dataExibicao}</td>
                        <td className="p-4 text-center space-x-2">
                          <button
                            type="button"
                            title="Editar Sessão"
                            className="text-green-500 hover:text-green-700 p-1 inline-flex"
                            onClick={() => handleEditSessao(sessao)}
                          >
                            <PencilSimple size={20} weight="bold" />
                          </button>
                          <button
                            type="button"
                            title="Excluir Sessão"
                            onClick={() => handleDeleteClick(sessao)}
                            className="text-red-500 hover:text-red-700 p-1 inline-flex"
                          >
                            <TrashSimple size={20} weight="bold" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500">
                      Nenhuma sessão encontrada com os filtros aplicados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Paginação */}
        {filteredSessoes.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}

        {/* Modals */}
        {editingSessao && (
          <EditarSessaoModal
            sessao={editingSessao}
            open={!!editingSessao}
            onClose={() => setEditingSessao(null)}
            onSuccess={handleEditSuccess}
          />
        )}

        {deletingSessao && (
          <DeletarSessaoModal
            sessao={deletingSessao}
            open={!!deletingSessao}
            onClose={() => setDeletingSessao(null)}
            onSuccess={handleDeleteSuccess}
          />
        )}
      </main>
    </div>
  );
}
