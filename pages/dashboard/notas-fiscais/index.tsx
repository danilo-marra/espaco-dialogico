import { useState, useMemo } from "react";
import Pagination from "components/Pagination";
import {
  format,
  addMonths,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  Receipt,
  CalendarBlank,
  User,
  CaretLeft,
  CaretRight,
  Calendar,
} from "@phosphor-icons/react";
import { useFetchSessoes } from "hooks/useFetchSessoes";
import { useFetchTerapeutas } from "hooks/useFetchTerapeutas";
import useAuth from "hooks/useAuth";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "store/store";
import { updateSessao } from "store/sessoesSlice";
import { toast } from "sonner";
import { mutate } from "swr";
import type { Sessao } from "tipos";
import { getNotaFiscalStatusColor } from "utils/statusColors";
import React from "react";

// Opções de status das notas fiscais
const STATUS_NOTA_FISCAL = ["Não Emitida", "Emitida", "Enviada"];

// Função para filtrar sessões com pagamento realizado
const filterSessoesComPagamento = (sessoes: Sessao[]): Sessao[] => {
  if (!Array.isArray(sessoes)) {
    return [];
  }

  return sessoes
    .filter((sessao) => sessao.pagamentoRealizado === true)
    .sort((a, b) => {
      // Ordenar por data do agendamento (mais recente primeiro)
      const dateA = a.agendamentoInfo?.dataAgendamento
        ? new Date(a.agendamentoInfo.dataAgendamento).getTime()
        : 0;
      const dateB = b.agendamentoInfo?.dataAgendamento
        ? new Date(b.agendamentoInfo.dataAgendamento).getTime()
        : 0;
      return dateB - dateA;
    });
};

const NotasFiscais = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    sessoes,
    isLoading,
    isError,
    mutate: mutateSessoes,
  } = useFetchSessoes();
  const { terapeutas } = useFetchTerapeutas();
  const { canEdit } = useAuth();

  const [filtroTerapeuta, setFiltroTerapeuta] = useState("Todos");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingUpdate, setLoadingUpdate] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const itemsPerPage = 5; // Reduzido para 5 pacientes por página devido ao novo layout

  // Filtrar sessões com pagamento realizado
  const sessoesComPagamento = useMemo(() => {
    if (!sessoes) return [];

    let filtered = filterSessoesComPagamento(sessoes);

    // Filtrar por mês/ano atual
    const startMonth = startOfMonth(currentDate);
    const endMonth = endOfMonth(currentDate);

    filtered = filtered.filter((sessao) => {
      if (!sessao.agendamentoInfo?.dataAgendamento) return false;
      const sessionDate = new Date(sessao.agendamentoInfo.dataAgendamento);
      return isWithinInterval(sessionDate, {
        start: startMonth,
        end: endMonth,
      });
    });

    // Filtrar por terapeuta
    if (filtroTerapeuta !== "Todos") {
      filtered = filtered.filter(
        (sessao) => String(sessao.terapeuta_id) === String(filtroTerapeuta),
      );
    }

    // Filtrar por status da nota fiscal
    if (filtroStatus !== "Todos") {
      filtered = filtered.filter(
        (sessao) => sessao.notaFiscal === filtroStatus,
      );
    }

    return filtered;
  }, [sessoes, filtroTerapeuta, filtroStatus, currentDate]);

  // Agrupar sessões por paciente
  const sessoesAgrupadasPorPaciente = useMemo(() => {
    if (!sessoesComPagamento) return {};

    const grupos: Record<string, Sessao[]> = {};

    sessoesComPagamento.forEach((sessao) => {
      const pacienteKey = `${sessao.paciente_id}-${sessao.pacienteInfo?.nome || "Sem nome"}`;
      if (!grupos[pacienteKey]) {
        grupos[pacienteKey] = [];
      }
      grupos[pacienteKey].push(sessao);
    });

    // Ordenar as sessões dentro de cada grupo por data
    Object.keys(grupos).forEach((key) => {
      grupos[key].sort((a, b) => {
        const dateA = a.agendamentoInfo?.dataAgendamento
          ? new Date(a.agendamentoInfo.dataAgendamento).getTime()
          : 0;
        const dateB = b.agendamentoInfo?.dataAgendamento
          ? new Date(b.agendamentoInfo.dataAgendamento).getTime()
          : 0;
        return dateB - dateA;
      });
    });

    return grupos;
  }, [sessoesComPagamento]);

  // Converter grupos em array para paginação
  const gruposPacientes = useMemo(() => {
    return Object.entries(sessoesAgrupadasPorPaciente).map(([key, sessoes]) => {
      // Determinar o status comum das notas fiscais do grupo
      const firstStatus = sessoes[0]?.notaFiscal;
      const allSameStatus = sessoes.every((s) => s.notaFiscal === firstStatus);

      return {
        pacienteKey: key,
        pacienteNome:
          sessoes[0]?.pacienteInfo?.nome || "Paciente não encontrado",
        sessoes: sessoes,
        totalSessoes: sessoes.length,
        valorTotal: sessoes.reduce(
          (total, sessao) => total + (sessao.valorSessao || 0),
          0,
        ),
        commonStatus: allSameStatus ? firstStatus : null, // Adiciona o status comum
      };
    });
  }, [sessoesAgrupadasPorPaciente]);

  // Paginação
  const totalPages = Math.ceil(gruposPacientes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = gruposPacientes.slice(startIndex, endIndex);

  // Estatísticas
  const estatisticas = useMemo(() => {
    if (!sessoesComPagamento)
      return { total: 0, naoEmitidas: 0, emitidas: 0, enviadas: 0 };

    return {
      total: sessoesComPagamento.length,
      naoEmitidas: sessoesComPagamento.filter(
        (s) => s.notaFiscal === "Não Emitida",
      ).length,
      emitidas: sessoesComPagamento.filter((s) => s.notaFiscal === "Emitida")
        .length,
      enviadas: sessoesComPagamento.filter((s) => s.notaFiscal === "Enviada")
        .length,
    };
  }, [sessoesComPagamento]);

  // Função para atualizar o status da nota fiscal
  const handleUpdateNotaFiscal = async (sessao: Sessao, novoStatus: string) => {
    if (!canEdit) {
      toast.error("Você não tem permissão para editar.");
      return;
    }

    // Validar se o status é válido
    if (!STATUS_NOTA_FISCAL.includes(novoStatus)) {
      toast.error("Status inválido.");
      return;
    }

    setLoadingUpdate(sessao.id);

    try {
      await dispatch(
        updateSessao({
          id: sessao.id,
          sessao: {
            notaFiscal: novoStatus as "Não Emitida" | "Emitida" | "Enviada",
          },
        }),
      ).unwrap();

      // Revalidar dados
      await mutate("/sessoes");
      mutateSessoes();

      toast.success(
        `Nota fiscal da sessão de ${sessao.pacienteInfo?.nome} atualizada para "${novoStatus}".`,
      );
    } catch (error) {
      console.error("Erro ao atualizar nota fiscal:", error);
      toast.error("Erro ao atualizar status da nota fiscal.");
    } finally {
      setLoadingUpdate(null);
    }
  };

  // Funções para navegação de data
  const handleDateChange = (date: Date) => {
    setCurrentDate(date);
    setCurrentPage(1); // Reset pagination when date changes
  };

  const handleMonthChange = (change: number) => {
    const newDate = addMonths(currentDate, change);
    setCurrentDate(newDate);
    setCurrentPage(1); // Reset pagination when month changes
  };

  // Função para atualizar o status da nota fiscal em lote para todas as sessões de um paciente
  const handleBulkUpdateNotaFiscal = async (
    sessoes: Sessao[],
    novoStatus: string,
    pacienteKey: string,
    pacienteNome: string,
  ) => {
    if (!canEdit) {
      toast.error("Você não tem permissão para editar.");
      return;
    }

    // Validar se o status é válido
    if (!STATUS_NOTA_FISCAL.includes(novoStatus)) {
      toast.error("Status inválido.");
      return;
    }

    setLoadingUpdate(`bulk-${pacienteKey}`);

    try {
      // Atualizar todas as sessões em paralelo
      await Promise.all(
        sessoes.map((sessao) =>
          dispatch(
            updateSessao({
              id: sessao.id,
              sessao: {
                notaFiscal: novoStatus as "Não Emitida" | "Emitida" | "Enviada",
              },
            }),
          ).unwrap(),
        ),
      );

      // Revalidar dados
      await mutate("/sessoes");
      mutateSessoes();

      toast.success(
        `Status da nota fiscal de todas as sessões de ${pacienteNome} atualizado para "${novoStatus}".`,
      );
    } catch (error) {
      console.error("Erro ao atualizar notas fiscais:", error);
      toast.error("Erro ao atualizar status das notas fiscais.");
    } finally {
      setLoadingUpdate(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-azul"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center text-red-500 p-8">
        Erro ao carregar as sessões. Tente novamente.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <Receipt size={32} className="text-azul" />
          <h1 className="text-2xl font-bold text-azul">
            Gerenciar Notas Fiscais
          </h1>
        </div>
        <p className="text-gray-600">
          Gerencie o status das notas fiscais para sessões com pagamento
          realizado.
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Sessões</p>
              <p className="text-2xl font-bold text-azul">
                {estatisticas.total}
              </p>
            </div>
            <Receipt size={24} className="text-azul" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Não Emitidas</p>
              <p className="text-2xl font-bold text-red-600">
                {estatisticas.naoEmitidas}
              </p>
            </div>
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Emitidas</p>
              <p className="text-2xl font-bold text-yellow-600">
                {estatisticas.emitidas}
              </p>
            </div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Enviadas</p>
              <p className="text-2xl font-bold text-green-600">
                {estatisticas.enviadas}
              </p>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-azul mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="filtroTerapeuta"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Terapeuta
            </label>
            <select
              id="filtroTerapeuta"
              value={filtroTerapeuta}
              onChange={(e) => {
                setFiltroTerapeuta(e.target.value);
                setCurrentPage(1);
              }}
              className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
            >
              <option value="Todos">Todos os Terapeutas</option>
              {terapeutas?.map((terapeuta) => (
                <option key={terapeuta.id} value={terapeuta.id}>
                  {terapeuta.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filtroStatus"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Status da Nota Fiscal
            </label>
            <select
              id="filtroStatus"
              value={filtroStatus}
              onChange={(e) => {
                setFiltroStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
            >
              <option value="Todos">Todos os Status</option>
              {STATUS_NOTA_FISCAL.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Navegação por Mês */}
      <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
        <button
          type="button"
          aria-label="Mês Anterior"
          onClick={() => handleMonthChange(-1)}
          className="hover:bg-gray-100 p-2 rounded-full transition-colors flex-shrink-0"
        >
          <CaretLeft size={24} weight="fill" />
        </button>
        <div className="flex items-center justify-center min-w-0 px-2 sm:px-4">
          <h2 className="text-sm font-semibold text-center sm:text-lg md:text-xl text-azul">
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

      {/* Lista de Sessões */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-azul">
            Sessões com Pagamento Realizado
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {gruposPacientes.length} paciente
            {gruposPacientes.length !== 1 ? "s" : ""} com sessões pagas
          </p>
        </div>

        {currentItems.length === 0 ? (
          <div className="text-center py-8">
            <Receipt size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              Nenhuma sessão encontrada com os filtros aplicados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {currentItems.map((grupo) => (
              <div key={grupo.pacienteKey} className="mb-6 last:mb-0">
                {/* Cabeçalho do Paciente */}
                <div className="bg-azul/5 border-l-4 border-azul px-6 py-3 mb-2">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                      <User size={20} className="text-azul flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-azul text-lg">
                          {grupo.pacienteNome}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {grupo.totalSessoes}{" "}
                          {grupo.totalSessoes === 1 ? "sessão" : "sessões"} •
                          Valor total: R${" "}
                          {grupo.valorTotal.toFixed(2).replace(".", ",")}
                        </p>
                      </div>
                    </div>

                    {/* Ações em Lote */}
                    <div className="flex items-center space-x-2 sm:space-x-4 pl-8 sm:pl-0">
                      <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                        Atualizar todas:
                      </span>
                      {loadingUpdate === `bulk-${grupo.pacienteKey}` ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-azul mr-2"></div>
                          <span className="text-xs text-gray-500">
                            Atualizando...
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-3">
                          {STATUS_NOTA_FISCAL.map((status) => (
                            <label
                              key={status}
                              className="flex items-center space-x-1 cursor-pointer text-sm hover:text-azul transition-colors"
                            >
                              <input
                                type="radio"
                                name={`bulk-status-${grupo.pacienteKey}`}
                                className="h-4 w-4 text-azul focus:ring-azul border-gray-300 cursor-pointer"
                                checked={grupo.commonStatus === status} // Controla o estado do radio
                                onChange={() =>
                                  handleBulkUpdateNotaFiscal(
                                    grupo.sessoes,
                                    status,
                                    grupo.pacienteKey,
                                    grupo.pacienteNome,
                                  )
                                }
                                disabled={!canEdit}
                              />
                              <span>{status}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tabela de Sessões do Paciente */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data da Sessão
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Terapeuta
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status Nota Fiscal
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {grupo.sessoes.map((sessao) => (
                        <tr key={sessao.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <CalendarBlank
                                size={16}
                                className="text-gray-400 mr-2"
                              />
                              {sessao.agendamentoInfo?.dataAgendamento
                                ? format(
                                    new Date(
                                      sessao.agendamentoInfo.dataAgendamento,
                                    ),
                                    "dd/MM/yyyy",
                                    { locale: ptBR },
                                  )
                                : "Data não disponível"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <User size={16} className="text-gray-400 mr-2" />
                              {sessao.terapeutaInfo?.nome ||
                                "Terapeuta não encontrado"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              R${" "}
                              {sessao.valorSessao
                                ?.toFixed(2)
                                .replace(".", ",") || "0,00"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getNotaFiscalStatusColor(
                                sessao.notaFiscal || "Não Emitida",
                              )}`}
                            >
                              {sessao.notaFiscal || "Não Emitida"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <select
                              value={sessao.notaFiscal || "Não Emitida"}
                              onChange={(e) =>
                                handleUpdateNotaFiscal(sessao, e.target.value)
                              }
                              disabled={loadingUpdate === sessao.id || !canEdit}
                              className="shadow-rosa/50 focus:shadow-rosa block w-full rounded-md px-3 py-1 text-sm leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px] disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                              {STATUS_NOTA_FISCAL.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                            {loadingUpdate === sessao.id && (
                              <div className="flex items-center mt-1">
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-azul mr-2"></div>
                                <span className="text-xs text-gray-500">
                                  Atualizando...
                                </span>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default NotasFiscais;
