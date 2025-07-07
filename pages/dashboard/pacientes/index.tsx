import {
  PencilSimple,
  Plus,
  TrashSimple,
  User,
  Users,
  UsersThree,
} from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import Pagination from "components/Pagination";
import { DeletarPacienteModal } from "components/Paciente/DeletarPacienteModal";
import { NovoPacienteModal } from "components/Paciente/NovoPacienteModal";
import { useFetchPacientes } from "hooks/useFetchPacientes";
import { useFetchTerapeutas } from "hooks/useFetchTerapeutas";
import Head from "next/head";
import React, { useMemo, useState } from "react";
import type { Paciente } from "tipos";
import { dateFormatter } from "utils/formatter";
import { EditarPacienteModal } from "components/Paciente/EditarPacienteModal";
import { calculateAge } from "utils/dateUtils";

const PACIENTES_PER_PAGE = 10;

const filterPacientes = (
  pacientes: Paciente[],
  selectedTerapeuta: string,
  searchQuery: string,
): Paciente[] => {
  // Primeiro ordenamos os pacientes (do mais recente para o mais antigo)
  return pacientes
    .slice() // Cria uma cópia do array para não modificar o original
    .sort((a, b) => {
      // Ordenando por ID decrescente (assumindo que IDs mais altos são mais recentes)
      if (typeof a.id === "number" && typeof b.id === "number") {
        return b.id - a.id;
      }
      // Alternativa: ordenar por data de entrada
      const dateA = new Date(a.dt_entrada || 0).getTime();
      const dateB = new Date(b.dt_entrada || 0).getTime();
      return dateB - dateA;
    })
    .filter((paciente) => {
      const matchesTerapeuta =
        selectedTerapeuta === "Todos" ||
        (paciente.terapeutaInfo &&
          String(paciente.terapeutaInfo.id) === String(selectedTerapeuta));

      const matchesSearch =
        searchQuery === "" ||
        paciente.nome.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesTerapeuta && matchesSearch;
    });
};

export default function Pacientes() {
  const { pacientes, isLoading, isError, mutate } = useFetchPacientes();
  const { terapeutas } = useFetchTerapeutas();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTerapeuta, setSelectedTerapeuta] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingPaciente, setEditingPaciente] = useState<Paciente | null>(null);
  const [deletingPaciente, setDeletingPaciente] = useState<Paciente | null>(
    null,
  );
  const [isNewPacienteOpen, setIsNewPacienteOpen] = useState(false);

  const handleEditPaciente = (paciente: Paciente) => {
    setEditingPaciente(paciente);
  };

  const handleEditSuccess = () => {
    mutate();
    setEditingPaciente(null);
  };

  const handleDeleteClick = (paciente: Paciente) => {
    setDeletingPaciente(paciente);
  };

  const handleDeleteSuccess = () => {
    mutate();
    setDeletingPaciente(null);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Função para formatar data com segurança
  const formatSafeDate = (dateValue) => {
    if (!dateValue) return "Data não informada";

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

  // Filtrar pacientes
  const filteredPacientes = useMemo(
    () =>
      pacientes
        ? filterPacientes(pacientes, selectedTerapeuta, searchQuery)
        : [],
    [pacientes, selectedTerapeuta, searchQuery],
  );

  // Paginação
  const paginatedPacientes = useMemo(() => {
    const startIndex = (currentPage - 1) * PACIENTES_PER_PAGE;
    return filteredPacientes.slice(startIndex, startIndex + PACIENTES_PER_PAGE);
  }, [filteredPacientes, currentPage]);

  // Show loading state
  if (isLoading) return <div>Carregando...</div>;

  // Show error state
  if (isError) return <div>Erro ao carregar dados.</div>;

  const totalPages = Math.ceil(filteredPacientes.length / PACIENTES_PER_PAGE);

  // Handlers
  const handleTerapeutaChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setSelectedTerapeuta(event.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="flex min-h-screen">
      <Head>
        <title>Pacientes</title>
      </Head>
      <main className="flex-1 bg-gray-100 p-4 min-w-0 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col space-y-4 mb-6 sm:flex-row sm:space-y-0 sm:items-center sm:justify-between">
          <h1 className="text-xl font-semibold sm:text-2xl">Pacientes</h1>
          <Dialog.Root
            open={isNewPacienteOpen}
            onOpenChange={setIsNewPacienteOpen}
          >
            <Dialog.Trigger asChild>
              <button
                type="button"
                className="flex items-center justify-center bg-azul text-white px-4 py-3 rounded hover:bg-sky-600 duration-150 w-full sm:w-auto"
              >
                <Plus size={20} weight="bold" className="mr-2" />
                <span className="sm:inline">Novo Paciente</span>
              </button>
            </Dialog.Trigger>
            <NovoPacienteModal
              onSuccess={() => mutate()}
              onClose={() => setIsNewPacienteOpen(false)}
            />
          </Dialog.Root>
        </div>

        {/* Filters and Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {/* Busca por paciente */}
          <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <Users size={24} className="text-gray-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <label htmlFor="search" className="sr-only">
                Buscar paciente
              </label>
              <input
                id="search"
                className="w-full text-sm lg:text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-azul/20 rounded px-3 py-2 border border-gray-200"
                type="text"
                placeholder="Buscar paciente..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
          </div>

          {/* Filtro por terapeuta */}
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
                onChange={handleTerapeutaChange}
              >
                <option value="Todos">Todos os terapeutas</option>
                {terapeutas?.map((terapeuta) => (
                  <option key={terapeuta.id} value={String(terapeuta.id)}>
                    {terapeuta.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Card de estatísticas - Terapeutas */}
          <div className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="p-3 bg-blue-100 rounded-full">
              <UsersThree size={24} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Terapeutas
              </h3>
              <span className="text-2xl font-bold text-gray-900">
                {terapeutas?.length || 0}
              </span>
            </div>
          </div>

          {/* Card de estatísticas - Pacientes */}
          <div className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="p-3 bg-green-100 rounded-full">
              <Users size={24} className="text-green-600" />
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Pacientes
              </h3>
              <span className="text-2xl font-bold text-gray-900">
                {filteredPacientes.length}
              </span>
              <span className="text-sm text-gray-500 ml-1">
                de {pacientes?.length || 0}
              </span>
            </div>
          </div>
        </div>
        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-rosa text-white">
                <tr>
                  <th className="p-3 text-left text-sm font-medium">Nome</th>
                  <th className="p-3 text-left text-sm font-medium">
                    Terapeuta
                  </th>
                  <th className="p-3 text-left text-sm font-medium hidden lg:table-cell">
                    Data Nascimento
                  </th>
                  <th className="p-3 text-left text-sm font-medium hidden lg:table-cell">
                    Idade
                  </th>
                  <th className="p-3 text-left text-sm font-medium hidden xl:table-cell">
                    Responsável
                  </th>
                  <th className="p-3 text-left text-sm font-medium hidden xl:table-cell">
                    Telefone
                  </th>
                  <th className="p-3 text-left text-sm font-medium hidden 2xl:table-cell">
                    Email
                  </th>
                  <th className="p-3 text-left text-sm font-medium hidden lg:table-cell">
                    Origem
                  </th>
                  <th className="p-3 text-left text-sm font-medium hidden lg:table-cell">
                    Data Entrada
                  </th>
                  <th className="p-3 text-center text-sm font-medium sticky right-0 bg-rosa">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedPacientes.map((paciente, index) => (
                  <tr
                    key={paciente.id}
                    className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                  >
                    <td className="p-3">
                      <div className="font-medium text-gray-900 text-sm lg:text-base">
                        {paciente.nome}
                      </div>
                      {/* Informações extras em telas menores */}
                      <div className="lg:hidden mt-1 space-y-1">
                        <div className="text-xs text-gray-500">
                          Nasc: {formatSafeDate(paciente.dt_nascimento)}
                        </div>
                        {paciente.nome_responsavel && (
                          <div className="xl:hidden text-xs text-gray-600">
                            Resp: {paciente.nome_responsavel}
                          </div>
                        )}
                        {paciente.origem && (
                          <div className="text-xs text-gray-500">
                            Origem: {paciente.origem}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm lg:text-base text-gray-900">
                        {paciente.terapeutaInfo?.nome || (
                          <span className="text-orange-600 font-medium">
                            Não atribuído
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 hidden lg:table-cell text-sm text-gray-600">
                      {formatSafeDate(paciente.dt_nascimento)}
                    </td>
                    <td className="p-3 hidden lg:table-cell text-sm text-gray-600">
                      {calculateAge(paciente.dt_nascimento)}
                    </td>
                    <td className="p-3 hidden xl:table-cell text-sm text-gray-600">
                      {paciente.nome_responsavel || (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-3 hidden xl:table-cell text-sm text-gray-600">
                      {paciente.telefone_responsavel ? (
                        <a
                          href={`tel:${paciente.telefone_responsavel}`}
                          className="text-azul hover:underline"
                        >
                          {paciente.telefone_responsavel}
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-3 hidden 2xl:table-cell text-sm text-gray-600">
                      {paciente.email_responsavel ? (
                        <a
                          href={`mailto:${paciente.email_responsavel}`}
                          className="text-azul hover:underline max-w-[200px] truncate block"
                          title={paciente.email_responsavel}
                        >
                          {paciente.email_responsavel}
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-3 hidden lg:table-cell text-sm text-gray-600">
                      <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                        {paciente.origem || "Não informado"}
                      </span>
                    </td>
                    <td className="p-3 hidden lg:table-cell text-sm text-gray-600">
                      {formatSafeDate(paciente.dt_entrada)}
                    </td>
                    <td className="p-3 sticky right-0 bg-white">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          type="button"
                          title="Editar Paciente"
                          className="text-green-500 hover:text-green-700 p-2 rounded-md hover:bg-green-50 transition-all duration-200"
                          onClick={() => handleEditPaciente(paciente)}
                        >
                          <PencilSimple size={16} weight="bold" />
                        </button>
                        <button
                          type="button"
                          title="Excluir Paciente"
                          onClick={() => handleDeleteClick(paciente)}
                          className="text-red-500 hover:text-red-700 p-2 rounded-md hover:bg-red-50 transition-all duration-200"
                        >
                          <TrashSimple size={16} weight="bold" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mensagem quando não há pacientes */}
          {paginatedPacientes.length === 0 && (
            <div className="text-center py-12 px-4">
              <div className="max-w-md mx-auto">
                <Users size={64} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhum paciente encontrado
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery || selectedTerapeuta !== "Todos"
                    ? "Tente ajustar os filtros de busca para encontrar o que está procurando."
                    : "Comece adicionando seu primeiro paciente ao sistema."}
                </p>
                {!searchQuery && selectedTerapeuta === "Todos" && (
                  <button
                    type="button"
                    onClick={() => setIsNewPacienteOpen(true)}
                    className="inline-flex items-center px-4 py-2 bg-azul text-white rounded-md hover:bg-sky-600 transition-colors"
                  >
                    <Plus size={20} weight="bold" className="mr-2" />
                    Adicionar Primeiro Paciente
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />

        {/* Modals */}
        {editingPaciente && (
          <EditarPacienteModal
            paciente={editingPaciente}
            open={!!editingPaciente}
            onClose={() => setEditingPaciente(null)}
            onSuccess={handleEditSuccess}
          />
        )}

        {deletingPaciente && (
          <DeletarPacienteModal
            paciente={deletingPaciente}
            open={!!deletingPaciente}
            onClose={() => setDeletingPaciente(null)}
            onSuccess={handleDeleteSuccess}
          />
        )}
      </main>
    </div>
  );
}
