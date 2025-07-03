import { useState, useMemo } from "react";
import Pagination from "components/Pagination";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Receipt,
  CalendarBlank,
  User,
  CurrencyDollar,
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

  const itemsPerPage = 10;

  // Filtrar sessões com pagamento realizado
  const sessoesComPagamento = useMemo(() => {
    if (!sessoes) return [];

    let filtered = filterSessoesComPagamento(sessoes);

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
  }, [sessoes, filtroTerapeuta, filtroStatus]);

  // Paginação
  const totalPages = Math.ceil(sessoesComPagamento.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = sessoesComPagamento.slice(startIndex, endIndex);

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

      {/* Lista de Sessões */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-azul">
            Sessões com Pagamento Realizado
          </h2>
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
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Terapeuta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paciente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status Atual
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems.map((sessao) => (
                  <tr key={sessao.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <CalendarBlank
                          size={16}
                          className="text-gray-400 mr-2"
                        />
                        {sessao.agendamentoInfo?.dataAgendamento
                          ? format(
                              new Date(sessao.agendamentoInfo.dataAgendamento),
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
                      {sessao.pacienteInfo?.nome || "Paciente não encontrado"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <CurrencyDollar
                          size={16}
                          className="text-gray-400 mr-1"
                        />
                        R${" "}
                        {sessao.valorSessao?.toFixed(2).replace(".", ",") ||
                          "0,00"}
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
