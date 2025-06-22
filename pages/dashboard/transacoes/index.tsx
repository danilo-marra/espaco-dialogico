import {
  TrendUp,
  TrendDown,
  Wallet,
  Receipt,
  Plus,
  CaretLeft,
  CaretRight,
  Calendar,
  CurrencyDollar,
  ChartPie,
  Note,
  PencilSimple,
  Trash,
} from "@phosphor-icons/react";
import Head from "next/head";
import Image from "next/image";
import React, { useMemo, useState } from "react";
import { useFetchSessoes } from "hooks/useFetchSessoes";
import { useFetchTransacoes } from "hooks/useFetchTransacoes";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import useAuth from "hooks/useAuth";
import { parseAnyDate, isValidDate } from "utils/dateUtils";
import * as Dialog from "@radix-ui/react-dialog";
import NovaTransacaoModal from "../../../components/Transacao/NovaTransacaoModal";
import EditarTransacaoModal from "../../../components/Transacao/EditarTransacaoModal";
import DeletarTransacaoModal from "../../../components/Transacao/DeletarTransacaoModal";

/**
 * Dashboard de Transações Financeiras
 *
 * Integra funções do dateUtils para manipulação segura de datas:
 * - parseAnyDate: Converte strings/datas de diferentes formatos de forma segura
 * - isValidDate: Valida objetos Date antes de usar
 *
 * Isso garante consistência na manipulação de datas entre diferentes ambientes
 * e evita problemas de timezone que podem ocorrer com new Date() direto.
 */

// Função para calcular repasse baseado no tempo de casa do terapeuta
function calcularRepasse(
  valorSessao: number,
  dataEntrada: string | Date,
): number {
  try {
    const entrada = parseAnyDate(dataEntrada);
    const agora = new Date();
    const mesesTrabalhando =
      (agora.getFullYear() - entrada.getFullYear()) * 12 +
      (agora.getMonth() - entrada.getMonth());

    // Regra atual: 45% para menos de 12 meses, 50% para 12 meses ou mais
    if (mesesTrabalhando < 12) {
      return valorSessao * 0.45;
    } else {
      return valorSessao * 0.5;
    }
  } catch (error) {
    console.warn("Erro ao calcular repasse:", error);
    // Retorna valor padrão em caso de erro (45%)
    return valorSessao * 0.45;
  }
}

// Função auxiliar para obter o valor de repasse correto
function obterValorRepasse(sessao: any): number {
  if (sessao.valorRepasse !== undefined && sessao.valorRepasse !== null) {
    return Number(sessao.valorRepasse);
  }

  if (sessao.terapeutaInfo?.dt_entrada) {
    return calcularRepasse(sessao.valorSessao, sessao.terapeutaInfo.dt_entrada);
  }

  return sessao.valorSessao * 0.45;
}

// Função para filtrar sessões apenas pelo mês (usando data do agendamento)
const filterSessoesByMonth = (sessoes: any[], selectedMonth: Date): any[] => {
  if (!Array.isArray(sessoes)) {
    return [];
  }

  return sessoes.filter((sessao) => {
    // Usar a data do agendamento associado
    const dataAgendamento = sessao.agendamentoInfo?.data_agendamento;

    if (!dataAgendamento) {
      return false;
    }

    try {
      const data = parseAnyDate(dataAgendamento);
      if (isValidDate(data)) {
        const anoMesSessao = format(data, "yyyy-MM");
        const anoMesSelecionado = format(selectedMonth, "yyyy-MM");
        return anoMesSessao === anoMesSelecionado;
      }
    } catch (error) {
      console.warn(
        "Erro ao processar data do agendamento:",
        dataAgendamento,
        error,
      );
    }

    return false;
  });
};

export default function Transacoes() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showNovaTransacao, setShowNovaTransacao] = useState(false);
  const [showEditarTransacao, setShowEditarTransacao] = useState(false);
  const [transacaoParaEditar, setTransacaoParaEditar] = useState<any>(null);
  const [showDeletarTransacao, setShowDeletarTransacao] = useState(false);
  const [transacaoParaDeletar, setTransacaoParaDeletar] = useState<any>(null);

  // Buscar dados das sessões para calcular lucros e repasses
  const {
    sessoes,
    isLoading: isLoadingSessoes,
    isError: isErrorSessoes,
    mutate: mutateSessoes,
  } = useFetchSessoes();

  // Buscar todas as transações manuais do backend (sem filtros na API)
  const {
    transacoes: todasTransacoesManuais,
    isLoading: isLoadingTransacoes,
    isError: isErrorTransacoes,
    mutate: mutateTransacoes,
  } = useFetchTransacoes();

  // Filtrar transações manuais do mês atual (similar ao filtro de sessões)
  const transacoesManuais = useMemo(() => {
    if (!todasTransacoesManuais) return [];
    return todasTransacoesManuais.filter((transacao) => {
      try {
        const dataTransacao = parseAnyDate(transacao.data);
        if (isValidDate(dataTransacao)) {
          const anoMesTransacao = format(dataTransacao, "yyyy-MM");
          const anoMesSelecionado = format(currentDate, "yyyy-MM");
          return anoMesTransacao === anoMesSelecionado;
        }
      } catch (error) {
        console.warn(
          "Erro ao processar data da transação:",
          transacao.data,
          error,
        );
      }
      return false;
    });
  }, [todasTransacoesManuais, currentDate]);

  // Estados de loading e error combinados
  const isLoading = isLoadingSessoes || isLoadingTransacoes;
  const isError = isErrorSessoes || isErrorTransacoes;

  const mutate = () => {
    mutateSessoes();
    mutateTransacoes();
  };

  // Função para abrir o modal de edição
  const handleEditarTransacao = (transacao: any) => {
    setTransacaoParaEditar(transacao);
    setShowEditarTransacao(true);
  };

  const handleCloseEditarTransacao = () => {
    setShowEditarTransacao(false);
    setTransacaoParaEditar(null);
  };

  // Função para abrir o modal de deletar
  const handleDeletarTransacao = (transacao: any) => {
    setTransacaoParaDeletar(transacao);
    setShowDeletarTransacao(true);
  };

  const handleCloseDeletarTransacao = () => {
    setShowDeletarTransacao(false);
    setTransacaoParaDeletar(null);
  };

  // Filtrar sessões do mês atual
  const sessoesDoMes = useMemo(() => {
    if (!sessoes) return [];
    return filterSessoesByMonth(sessoes, currentDate);
  }, [sessoes, currentDate]);

  // Calcular receita total (faturamento das sessões)
  const receitaTotal = useMemo(() => {
    return sessoesDoMes.reduce(
      (total, sessao) => total + (sessao.valorSessao || 0),
      0,
    );
  }, [sessoesDoMes]);

  // Calcular repasses totais
  const repasseTotal = useMemo(() => {
    return sessoesDoMes.reduce((total, sessao) => {
      const repasse = obterValorRepasse(sessao);
      return total + repasse;
    }, 0);
  }, [sessoesDoMes]);

  // Calcular lucro líquido (receita - repasses) - não usado diretamente mas pode ser útil para futuras funcionalidades
  const _lucroLiquido = useMemo(() => {
    return receitaTotal - repasseTotal;
  }, [receitaTotal, repasseTotal]);

  const transacoesSessoes = useMemo(() => {
    return sessoesDoMes.flatMap((sessao) => {
      const repasse = obterValorRepasse(sessao);

      // Usar a data do agendamento associado
      const dataAgendamento = sessao.agendamentoInfo?.data_agendamento;
      if (!dataAgendamento) return [];

      let dataSessaoExibir = null;
      try {
        const data = parseAnyDate(dataAgendamento);
        if (isValidDate(data)) {
          dataSessaoExibir = data;
        }
      } catch (error) {
        console.warn("Erro ao processar data:", dataAgendamento, error);
      }

      if (!dataSessaoExibir) return [];

      // Retornar duas transações: uma de receita e uma de repasse
      return [
        {
          id: `${sessao.id}-receita`,
          tipo: "entrada",
          categoria: "Receita de Sessões",
          descricao: `${sessao.tipoSessao || "Sessão"} - ${sessao.pacienteInfo?.nome || "N/A"}`,
          valor: sessao.valorSessao || 0,
          data: dataSessaoExibir,
          terapeuta: sessao.terapeutaInfo,
          paciente: sessao.pacienteInfo,
          sessaoOriginal: sessao,
        },
        {
          id: `${sessao.id}-repasse`,
          tipo: "saida",
          categoria: "Repasse a Terapeutas",
          descricao: `Repasse - ${sessao.terapeutaInfo?.nome || "N/A"}`,
          valor: repasse,
          data: dataSessaoExibir,
          terapeuta: sessao.terapeutaInfo,
          paciente: sessao.pacienteInfo,
          sessaoOriginal: sessao,
        },
      ];
    });
  }, [sessoesDoMes]);

  // Combinar todas as transações e ordenar por data
  const todasTransacoes = useMemo(() => {
    // Converter transações manuais para o formato correto (já filtradas pelo mês atual)
    const transacoesManuaisFormatadas = transacoesManuais.map((transacao) => ({
      ...transacao,
      data: parseAnyDate(transacao.data),
    }));

    const combinadas = [...transacoesSessoes, ...transacoesManuaisFormatadas];
    return combinadas.sort(
      (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime(),
    );
  }, [transacoesSessoes, transacoesManuais]);

  // Recalcular totais incluindo transações manuais do mês atual
  const entradasManuais = useMemo(() => {
    return transacoesManuais
      .filter((t) => t.tipo === "entrada")
      .reduce((total, t) => total + (Number(t.valor) || 0), 0);
  }, [transacoesManuais]);

  const saidasManuais = useMemo(() => {
    return transacoesManuais
      .filter((t) => t.tipo === "saida")
      .reduce((total, t) => total + (Number(t.valor) || 0), 0);
  }, [transacoesManuais]);

  // Totais finais
  const totalEntradas = receitaTotal + entradasManuais;
  const totalSaidas = repasseTotal + saidasManuais;
  const saldoFinal = totalEntradas - totalSaidas;

  // Handlers
  const handleDateChange = (date: Date) => {
    if (isValidDate(date)) {
      setCurrentDate(date);
    } else {
      console.warn("Data inválida selecionada:", date);
      // Manter a data atual em caso de erro
    }
  };

  const handleMonthChange = (change: number) => {
    const newDate = addMonths(currentDate, change);
    setCurrentDate(newDate);
  };

  // Verificar se o usuário é admin
  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <div className="text-red-500 text-xl mb-4">Acesso negado.</div>
        <div className="text-gray-600">
          Apenas administradores podem acessar esta página.
        </div>
      </div>
    );
  }

  // Mostrar estado de carregamento
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-azul"></div>
        <span className="ml-4 text-xl">Carregando transações...</span>
      </div>
    );
  }

  // Mostrar estado de erro
  if (isError) {
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
  }

  return (
    <div className="flex min-h-screen">
      <Head>
        <title>Transações Financeiras</title>
      </Head>
      <main className="flex-1 bg-gray-100 p-4 min-w-0 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col space-y-4 mb-6 sm:flex-row sm:space-y-0 sm:items-center sm:justify-between">
          <h1 className="text-xl font-semibold sm:text-2xl">
            Transações Financeiras
          </h1>
          <button
            onClick={() => setShowNovaTransacao(true)}
            className="flex items-center space-x-2 bg-azul text-white px-4 py-2 rounded hover:bg-sky-600 transition-colors"
          >
            <Plus size={20} />
            <span>Nova Transação</span>
          </button>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center justify-between p-4 bg-white rounded shadow mb-6">
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

        {/* Cards de Resumo Financeiro */}
        <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total de Entradas */}
          <div className="flex items-center space-x-4 p-4 bg-white rounded shadow">
            <TrendUp size={32} className="text-green-500 flex-shrink-0" />
            <div className="min-w-0">
              <h3 className="text-xs uppercase text-gray-500 truncate">
                Total de Entradas
              </h3>
              <span className="text-xl font-semibold text-green-600">
                R$ {totalEntradas.toFixed(2).replace(".", ",")}
              </span>
            </div>
          </div>

          {/* Total de Saídas */}
          <div className="flex items-center space-x-4 p-4 bg-white rounded shadow">
            <TrendDown size={32} className="text-red-500 flex-shrink-0" />
            <div className="min-w-0">
              <h3 className="text-xs uppercase text-gray-500 truncate">
                Total de Saídas
              </h3>
              <span className="text-xl font-semibold text-red-600">
                R$ {totalSaidas.toFixed(2).replace(".", ",")}
              </span>
            </div>
          </div>

          {/* Saldo Final */}
          <div className="flex items-center space-x-4 p-4 bg-white rounded shadow">
            <Wallet
              size={32}
              className={saldoFinal >= 0 ? "text-blue-500" : "text-red-500"}
            />
            <div className="min-w-0">
              <h3 className="text-xs uppercase text-gray-500 truncate">
                Saldo Final
              </h3>
              <span
                className={`text-xl font-semibold ${saldoFinal >= 0 ? "text-blue-600" : "text-red-600"}`}
              >
                R$ {saldoFinal.toFixed(2).replace(".", ",")}
              </span>
            </div>
          </div>

          {/* Total de Sessões */}
          <div className="flex items-center space-x-4 p-4 bg-white rounded shadow">
            <Receipt size={32} className="text-purple-500 flex-shrink-0" />
            <div className="min-w-0">
              <h3 className="text-xs uppercase text-gray-500 truncate">
                Sessões do Mês
              </h3>
              <span className="text-xl font-semibold text-purple-600">
                {sessoesDoMes.length}
              </span>
            </div>
          </div>
        </div>

        {/* Detalhamento por Categoria */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Entradas Detalhadas */}
          <div className="bg-white rounded shadow p-6">
            <div className="flex items-center space-x-2 mb-4">
              <TrendUp size={24} className="text-green-500" />
              <h3 className="text-lg font-semibold">Entradas</h3>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div className="flex items-center space-x-2">
                  <CurrencyDollar size={20} className="text-green-500" />
                  <span>Receita de Sessões</span>
                </div>
                <span className="font-semibold text-green-600">
                  R$ {receitaTotal.toFixed(2).replace(".", ",")}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div className="flex items-center space-x-2">
                  <Plus size={20} className="text-gray-500" />
                  <span>Entradas Manuais</span>
                </div>
                <span className="font-semibold text-gray-600">
                  R$ {entradasManuais.toFixed(2).replace(".", ",")}
                </span>
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between items-center font-bold">
                  <span>Total de Entradas</span>
                  <span className="text-green-600">
                    R$ {totalEntradas.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Saídas Detalhadas */}
          <div className="bg-white rounded shadow p-6">
            <div className="flex items-center space-x-2 mb-4">
              <TrendDown size={24} className="text-red-500" />
              <h3 className="text-lg font-semibold">Saídas</h3>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div className="flex items-center space-x-2">
                  <ChartPie size={20} className="text-red-500" />
                  <span>Repasses a Terapeutas</span>
                </div>
                <span className="font-semibold text-red-600">
                  R$ {repasseTotal.toFixed(2).replace(".", ",")}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div className="flex items-center space-x-2">
                  <Note size={20} className="text-gray-500" />
                  <span>Despesas Manuais</span>
                </div>
                <span className="font-semibold text-gray-600">
                  R$ {saidasManuais.toFixed(2).replace(".", ",")}
                </span>
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between items-center font-bold">
                  <span>Total de Saídas</span>
                  <span className="text-red-600">
                    R$ {totalSaidas.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabela de Transações */}
        <div className="mt-6 bg-white rounded shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:items-center sm:justify-between">
              <h3 className="text-lg font-semibold">Transações do Período</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {todasTransacoes.length} transações encontradas
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Responsável
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {todasTransacoes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center space-y-2">
                        <Receipt size={48} className="text-gray-300" />
                        <span className="text-gray-500">
                          Nenhuma transação encontrada para este período
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  todasTransacoes.map((transacao) => {
                    return (
                      <tr key={transacao.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(new Date(transacao.data), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`text-sm font-medium ${
                              transacao.tipo === "entrada"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {transacao.tipo === "entrada"
                              ? "Receita"
                              : "Despesa"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="max-w-xs">
                            <p className="font-medium truncate">
                              {transacao.descricao}
                            </p>
                            {"paciente" in transacao && transacao.paciente && (
                              <p className="text-gray-500 text-xs truncate">
                                Paciente: {transacao.paciente.nome}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center space-x-3">
                            {"terapeuta" in transacao && transacao.terapeuta ? (
                              <>
                                {transacao.terapeuta.foto ? (
                                  <Image
                                    className="h-8 w-8 rounded-full object-cover"
                                    src={transacao.terapeuta.foto}
                                    alt={transacao.terapeuta.nome}
                                    width={32}
                                    height={32}
                                  />
                                ) : (
                                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                    <span className="text-xs font-medium text-gray-600">
                                      {transacao.terapeuta.nome?.charAt(0) ||
                                        "?"}
                                    </span>
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium">
                                    {transacao.terapeuta.nome}
                                  </p>
                                </div>
                              </>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <div className="h-8 w-8 rounded-full bg-blue-200 flex items-center justify-center">
                                  <span className="text-xs font-medium text-blue-600">
                                    A
                                  </span>
                                </div>
                                <span className="text-sm text-gray-600">
                                  {"usuario_nome" in transacao
                                    ? transacao.usuario_nome
                                    : "Sistema"}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <span
                            className={
                              transacao.tipo === "entrada"
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {transacao.tipo === "entrada" ? "+" : "-"}R${" "}
                            {Number(transacao.valor || 0)
                              .toFixed(2)
                              .replace(".", ",")}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {/* Mostrar botões de ação apenas para transações manuais */}
                          {!("sessaoOriginal" in transacao) && (
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleEditarTransacao(transacao)}
                                className="text-azul hover:text-sky-600 transition-colors p-1 rounded"
                                title="Editar transação"
                              >
                                <PencilSimple size={16} />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeletarTransacao(transacao)
                                }
                                className="text-red-500 hover:text-red-700 transition-colors p-1 rounded"
                                title="Deletar transação"
                              >
                                <Trash size={16} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Resumo da Tabela */}
          {todasTransacoes.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center space-x-4">
                  <span className="text-gray-600">
                    Total de {todasTransacoes.length} transações
                  </span>
                  <span className="text-xs text-gray-500">
                    ({sessoesDoMes.length * 2} automáticas +{" "}
                    {transacoesManuais.length} manuais)
                  </span>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <span className="text-gray-500">Total Entradas: </span>
                    <span className="font-semibold text-green-600">
                      R$ {totalEntradas.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-500">Total Saídas: </span>
                    <span className="font-semibold text-red-600">
                      R$ {totalSaidas.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-500">Saldo: </span>
                    <span
                      className={`font-semibold ${saldoFinal >= 0 ? "text-blue-600" : "text-red-600"}`}
                    >
                      R$ {saldoFinal.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal de Nova Transação */}
        <Dialog.Root
          open={showNovaTransacao}
          onOpenChange={setShowNovaTransacao}
        >
          <NovaTransacaoModal
            onClose={() => setShowNovaTransacao(false)}
            onSuccess={() => {
              // Recarregar transações após criar uma nova
              mutateTransacoes();
              setShowNovaTransacao(false);
            }}
          />
        </Dialog.Root>

        {/* Modal de Editar Transação */}
        <Dialog.Root
          open={showEditarTransacao}
          onOpenChange={setShowEditarTransacao}
        >
          {transacaoParaEditar && (
            <EditarTransacaoModal
              transacao={transacaoParaEditar}
              onClose={handleCloseEditarTransacao}
              onSuccess={() => {
                // Recarregar transações após editar
                mutateTransacoes();
                handleCloseEditarTransacao();
              }}
            />
          )}
        </Dialog.Root>

        {/* Modal de Deletar Transação */}
        <Dialog.Root
          open={showDeletarTransacao}
          onOpenChange={setShowDeletarTransacao}
        >
          {transacaoParaDeletar && (
            <DeletarTransacaoModal
              transacao={transacaoParaDeletar}
              onClose={handleCloseDeletarTransacao}
              onSuccess={() => {
                // Recarregar transações após deletar
                mutateTransacoes();
                handleCloseDeletarTransacao();
              }}
            />
          )}
        </Dialog.Root>
      </main>
    </div>
  );
}
