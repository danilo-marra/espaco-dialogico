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
} from "@phosphor-icons/react";
import Head from "next/head";
import React, { useMemo, useState } from "react";
import { useFetchSessoes } from "hooks/useFetchSessoes";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import useAuth from "hooks/useAuth";
import { parseAnyDate, isValidDate } from "utils/dateUtils";

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

// Função para filtrar sessões apenas pelo mês
const filterSessoesByMonth = (sessoes: any[], selectedMonth: Date): any[] => {
  if (!Array.isArray(sessoes)) {
    return [];
  }

  return sessoes.filter((sessao) => {
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
        try {
          const data = parseAnyDate(dataSessao);
          if (isValidDate(data)) {
            const anoMesSessao = format(data, "yyyy-MM");
            const anoMesSelecionado = format(selectedMonth, "yyyy-MM");

            if (anoMesSessao === anoMesSelecionado) {
              return true;
            }
          }
        } catch (error) {
          console.warn("Erro ao processar data da sessão:", dataSessao, error);
        }
      }
    }

    return false;
  });
};

export default function Transacoes() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showNovaTransacao, setShowNovaTransacao] = useState(false);

  // Buscar dados das sessões para calcular lucros e repasses
  const { sessoes, isLoading, isError, mutate } = useFetchSessoes();

  // Período atual formatado de forma segura para futuras integrações com backend
  const _periodoAtual = useMemo(() => {
    return format(currentDate, "yyyy-MM");
  }, [currentDate]);

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

  // Por enquanto, transações manuais serão zero (implementar depois)
  const entradasManuais = 0;
  const saidasManuais = 0;

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

        {/* Placeholder para futuras funcionalidades */}
        <div className="mt-6 bg-white rounded shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
            Próximas Funcionalidades
          </h3>
          <div className="space-y-2 text-gray-600">
            <p>• Cadastro de transações manuais (entradas e saídas)</p>
            <p>• Histórico detalhado de todas as transações</p>
            <p>• Filtros por categoria e período</p>
            <p>• Relatórios e gráficos financeiros</p>
            <p>• Exportação de dados para Excel/PDF</p>
          </div>
        </div>

        {/* Placeholder para Modal de Nova Transação */}
        {showNovaTransacao && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Nova Transação</h3>
              <p className="text-gray-600 mb-4">
                Esta funcionalidade será implementada em breve.
              </p>
              <button
                onClick={() => setShowNovaTransacao(false)}
                className="w-full bg-azul text-white py-2 rounded hover:bg-sky-600"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
