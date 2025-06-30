import React, { useState } from "react";
import Head from "next/head";
import { format, addMonths } from "date-fns";
import { CalendarCheck } from "@phosphor-icons/react";
import { ptBR } from "date-fns/locale";
import {
  CaretLeft,
  CaretRight,
  Calendar,
  CurrencyDollar,
  Receipt,
  User,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { useFetchFaturamento } from "hooks/useFetchFaturamento";
import { useFetchTerapeutas } from "hooks/useFetchTerapeutas";
import useAuth from "hooks/useAuth";
import { parseAnyDate } from "utils/dateUtils";
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
        <div className="flex flex-col space-y-4 mb-6 sm:flex-row sm:space-y-0 sm:items-center sm:justify-between">
          <h1 className="text-xl font-semibold sm:text-2xl">Faturamento</h1>
        </div>

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
              onChange={setCurrentDate}
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
        {(user.role === "admin" || user.role === "secretaria") && (
          <div className="grid grid-cols-1 gap-4 mb-6 lg:grid-cols-2">
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
                  onChange={(e) => setSelectedTerapeuta(e.target.value)}
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
                  onChange={(e) => setSearchPaciente(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="p-3 bg-blue-100 rounded-full">
              <Receipt size={24} className="text-blue-600" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Total de Sessões
              </h3>
              <span className="text-2xl font-bold text-gray-900">
                {faturamento?.resumo.totalSessoes || 0}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="p-3 bg-green-100 rounded-full">
              <CurrencyDollar size={24} className="text-green-600" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Valor Total
              </h3>
              <span className="text-2xl font-bold text-gray-900">
                R${" "}
                {faturamento?.resumo.valorTotalSessoes
                  .toFixed(2)
                  .replace(".", ",")}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="p-3 bg-purple-100 rounded-full">
              <User size={24} className="text-purple-600" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {user.role === "terapeuta" ? "Seu Repasse" : "Total Repasses"}
              </h3>
              <span className="text-2xl font-bold text-gray-900">
                R${" "}
                {faturamento?.resumo.valorTotalRepasse
                  .toFixed(2)
                  .replace(".", ",")}
              </span>
            </div>
          </div>
        </div>

        {/* Tabela de Sessões */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-rosa text-white">
                <tr>
                  <th className="p-3 text-left text-sm font-medium">Data</th>
                  <th className="p-3 text-left text-sm font-medium">Horário</th>
                  {(user.role === "admin" || user.role === "secretaria") && (
                    <th className="p-3 text-left text-sm font-medium">
                      Terapeuta
                    </th>
                  )}
                  <th className="p-3 text-left text-sm font-medium">
                    Paciente
                  </th>
                  <th className="p-3 text-left text-sm font-medium hidden lg:table-cell">
                    Tipo
                  </th>
                  <th className="p-3 text-left text-sm font-medium hidden xl:table-cell">
                    Modalidade
                  </th>
                  <th className="p-3 text-left text-sm font-medium">Valor</th>
                  <th className="p-3 text-left text-sm font-medium">
                    {user.role === "terapeuta" ? "Seu Repasse" : "Repasse"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {faturamento?.sessoes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={user.role === "terapeuta" ? 8 : 8}
                      className="text-center py-12 px-4"
                    >
                      <div className="max-w-md mx-auto">
                        <CalendarCheck
                          size={64}
                          className="mx-auto mb-4 text-gray-300"
                        />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Nenhuma sessão encontrada
                        </h3>
                        <p className="text-gray-600">
                          Tente ajustar os filtros de busca para encontrar o que
                          está procurando.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  faturamento?.sessoes.map((sessao, index) => (
                    <tr
                      key={sessao.id}
                      className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                    >
                      <td className="p-3">
                        <div className="text-sm lg:text-base text-gray-900">
                          {format(parseAnyDate(sessao.data), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm lg:text-base text-gray-900">
                          {sessao.horario}
                        </div>
                      </td>
                      {(user.role === "admin" ||
                        user.role === "secretaria") && (
                        <td className="p-3">
                          <div className="font-medium text-gray-900 text-sm lg:text-base">
                            {sessao.terapeuta}
                          </div>
                        </td>
                      )}
                      <td className="p-3">
                        <div className="text-sm lg:text-base text-gray-900">
                          {sessao.paciente}
                        </div>
                      </td>
                      <td className="p-3 hidden lg:table-cell text-sm text-gray-600">
                        <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium">
                          {sessao.tipo}
                        </span>
                      </td>
                      <td className="p-3 hidden xl:table-cell text-sm text-gray-600">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            sessao.modalidade === "Online"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {sessao.modalidade}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="text-sm lg:text-base font-semibold text-gray-900">
                          R$ {sessao.valor.toFixed(2).replace(".", ",")}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm font-medium text-green-600">
                          R$ {sessao.repasse.toFixed(2).replace(".", ",")}
                        </div>
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
