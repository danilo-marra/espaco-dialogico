import React, { useState, useMemo } from "react";
import Head from "next/head";
import { format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CaretLeft,
  CaretRight,
  Calendar,
  CurrencyDollar,
  Receipt,
  User,
  MagnifyingGlass,
  Tag,
} from "@phosphor-icons/react";
import { useFetchFaturamento } from "hooks/useFetchFaturamento";
import { useFetchTerapeutas } from "hooks/useFetchTerapeutas";
import useAuth from "hooks/useAuth";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function Faturamento() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Estados dos filtros (apenas para admin/secretaria)
  const [selectedTerapeuta, setSelectedTerapeuta] = useState("Todos");
  const [searchPaciente, setSearchPaciente] = useState("");

  const periodo = format(currentDate, "yyyy-MM");

  // Buscar dados de terapeutas para filtros (apenas se admin/secretaria)
  const { terapeutas } = useFetchTerapeutas();

  // Buscar dados de faturamento com filtros
  const { faturamento, isLoading, isError } = useFetchFaturamento({
    periodo,
    terapeutaId: selectedTerapeuta,
    paciente: searchPaciente,
  });

  const percentualRepasseMedio = useMemo(() => {
    if (!faturamento?.sessoes?.length) return 0;

    const somaPercentuais = faturamento.sessoes.reduce((acc, sessao) => {
      let percentual = 45;
      if (
        sessao.repasse !== undefined &&
        sessao.repasse !== null &&
        sessao.valor > 0
      ) {
        percentual = Math.round((sessao.repasse / sessao.valor) * 100);
      } else if (sessao.terapeuta_dt_entrada) {
        const dataEntrada = new Date(sessao.terapeuta_dt_entrada);
        const hoje = new Date();
        const diffMs = hoje.getTime() - dataEntrada.getTime();
        const umAnoMs = 365.25 * 24 * 60 * 60 * 1000;
        const anosNaClinica = diffMs / umAnoMs;
        percentual = anosNaClinica >= 1 ? 50 : 45;
      }
      return acc + percentual;
    }, 0);

    return Math.round(somaPercentuais / faturamento.sessoes.length);
  }, [faturamento?.sessoes]);

  // Calcular totais filtrados (se houver filtros ativos)
  const totaisCalculados = useMemo(() => {
    if (!faturamento?.sessoes) return { totalValor: 0, totalRepasse: 0 };

    return faturamento.sessoes.reduce(
      (acc, sessao) => ({
        totalValor: acc.totalValor + sessao.valor,
        totalRepasse: acc.totalRepasse + sessao.repasse,
      }),
      { totalValor: 0, totalRepasse: 0 },
    );
  }, [faturamento?.sessoes]);

  // Verificar se o usuário tem acesso
  if (!user || !["admin", "secretaria", "terapeuta"].includes(user.role)) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <div className="text-red-500 text-xl mb-4">Acesso negado.</div>
        <div className="text-gray-600">
          Você não tem permissão para acessar esta página.
        </div>
      </div>
    );
  }

  const handleMonthChange = (change: number) => {
    setCurrentDate(addMonths(currentDate, change));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-azul"></div>
        <span className="ml-4 text-xl">Carregando faturamento...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <div className="text-red-500 text-xl mb-4">Erro ao carregar dados.</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Head>
        <title>Faturamento</title>
      </Head>

      <main className="flex-1 bg-gray-100 p-4 min-w-0 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Faturamento</h1>
          <p className="text-gray-600 mt-1">
            {user.role === "terapeuta"
              ? "Visualize seus atendimentos e valores recebidos"
              : "Visualize o faturamento detalhado por terapeuta"}
          </p>
        </div>

        {/* Navegação de Data */}
        <div className="flex items-center justify-between p-4 bg-white rounded shadow mb-6">
          <button
            onClick={() => handleMonthChange(-1)}
            className="hover:bg-gray-100 p-2 rounded-full transition-colors"
          >
            <CaretLeft size={24} weight="fill" />
          </button>

          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold">
              {format(currentDate, "MMMM yyyy", { locale: ptBR }).replace(
                /^\w/,
                (c) => c.toUpperCase(),
              )}
            </h2>
            <DatePicker
              selected={currentDate}
              onChange={setCurrentDate}
              dateFormat="MM/yyyy"
              showMonthYearPicker
              customInput={
                <button className="hover:bg-gray-100 p-1 rounded">
                  <Calendar size={20} />
                </button>
              }
            />
          </div>

          <button
            onClick={() => handleMonthChange(1)}
            className="hover:bg-gray-100 p-2 rounded-full transition-colors"
          >
            <CaretRight size={24} weight="fill" />
          </button>
        </div>

        {/* Filtros (apenas para admin/secretaria) */}
        {(user.role === "admin" || user.role === "secretaria") && (
          <div className="bg-white p-4 rounded shadow mb-6">
            <h3 className="text-lg font-medium mb-4">Filtros</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Filtro por Terapeuta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Tag size={16} className="inline mr-1" />
                  Terapeuta
                </label>
                <select
                  value={selectedTerapeuta}
                  onChange={(e) => setSelectedTerapeuta(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-azul focus:border-transparent"
                >
                  <option value="Todos">Todos os Terapeutas</option>
                  {terapeutas?.map((terapeuta) => (
                    <option key={terapeuta.id} value={terapeuta.id}>
                      {terapeuta.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por Paciente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MagnifyingGlass size={16} className="inline mr-1" />
                  Buscar Paciente
                </label>
                <input
                  type="text"
                  value={searchPaciente}
                  onChange={(e) => setSearchPaciente(e.target.value)}
                  placeholder="Digite o nome do paciente..."
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-azul focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded shadow">
            <div className="flex items-center space-x-3">
              <Receipt size={32} className="text-blue-500" />
              <div>
                <h3 className="text-sm text-gray-500 uppercase">
                  Total de Sessões
                </h3>
                <p className="text-2xl font-semibold">
                  {faturamento?.resumo.totalSessoes || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded shadow">
            <div className="flex items-center space-x-3">
              <CurrencyDollar size={32} className="text-green-500" />
              <div>
                <h3 className="text-sm text-gray-500 uppercase">Valor Total</h3>
                <p className="text-2xl font-semibold text-green-600">
                  R$ {totaisCalculados.totalValor.toFixed(2).replace(".", ",")}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded shadow">
            <div className="flex items-center space-x-3">
              <User size={32} className="text-purple-500" />
              <div>
                <h3 className="text-sm text-gray-500 uppercase">
                  {user.role === "terapeuta" ? "Seu Repasse" : "Total Repasses"}
                </h3>
                <p className="text-2xl font-semibold text-purple-600">
                  R${" "}
                  {totaisCalculados.totalRepasse.toFixed(2).replace(".", ",")}
                  {faturamento?.sessoes?.length > 0 && (
                    <span className="ml-2 text-base text-gray-500 font-normal align-middle">
                      ({percentualRepasseMedio}%)
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabela de Sessões */}
        <div className="bg-white rounded shadow">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Detalhamento das Sessões</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Horário
                  </th>
                  {(user.role === "admin" || user.role === "secretaria") && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Terapeuta
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Paciente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Modalidade
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    {user.role === "terapeuta" ? "Seu Repasse" : "Repasse"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {faturamento?.sessoes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={user.role === "terapeuta" ? 8 : 9}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      Nenhuma sessão encontrada para este período
                    </td>
                  </tr>
                ) : (
                  faturamento?.sessoes.map((sessao) => (
                    <tr key={sessao.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {format(new Date(sessao.data), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {sessao.horario}
                      </td>
                      {(user.role === "admin" ||
                        user.role === "secretaria") && (
                        <td className="px-6 py-4 text-sm">
                          {sessao.terapeuta}
                        </td>
                      )}
                      <td className="px-6 py-4 text-sm">{sessao.paciente}</td>
                      <td className="px-6 py-4 text-sm">{sessao.tipo}</td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            sessao.modalidade === "Online"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {sessao.modalidade}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                        R$ {sessao.valor.toFixed(2).replace(".", ",")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                        R$ {sessao.repasse.toFixed(2).replace(".", ",")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
