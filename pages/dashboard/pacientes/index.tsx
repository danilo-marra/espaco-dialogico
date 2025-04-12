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
import { NovoPacienteModal } from "components/Paciente/NovoPacienteModal";
import { useFetchPacientes } from "hooks/useFetchPacientes";
import { useFetchTerapeutas } from "hooks/useFetchTerapeutas";
import Head from "next/head";
import React, { useMemo, useState } from "react";
import type { Paciente } from "tipos";
import { dateFormatter } from "utils/formatter";

const PACIENTES_PER_PAGE = 10;

const filterPacientes = (
  pacientes: Paciente[],
  selectedTerapeuta: string,
): Paciente[] => {
  return pacientes.filter(
    (paciente) =>
      selectedTerapeuta === "Todos" ||
      (paciente.terapeutaInfo &&
        String(paciente.terapeutaInfo.id) === String(selectedTerapeuta)),
  );
};

export default function Pacientes() {
  const { pacientes, isLoading, isError, mutate } = useFetchPacientes();
  const { terapeutas } = useFetchTerapeutas();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTerapeuta, setSelectedTerapeuta] = useState("Todos");
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
    () => (pacientes ? filterPacientes(pacientes, selectedTerapeuta) : []),
    [pacientes, selectedTerapeuta],
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
      <main className="flex-1 bg-gray-100 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Pacientes</h1>
          <Dialog.Root
            open={isNewPacienteOpen}
            onOpenChange={setIsNewPacienteOpen}
          >
            <Dialog.Trigger asChild>
              <button
                type="button"
                className="flex items-center bg-azul text-white px-4 py-2 rounded hover:bg-sky-600 duration-150"
              >
                <Plus size={20} weight="bold" className="mr-2" />
                Novo Paciente
              </button>
            </Dialog.Trigger>
            <NovoPacienteModal
              onSuccess={() => mutate()}
              onClose={() => setIsNewPacienteOpen(false)}
            />
          </Dialog.Root>
        </div>

        {/* Filters and Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="flex items-center space-x-4 p-4 bg-white rounded shadow">
            <User size={24} />
            <label htmlFor="terapeutas" className="text-xl font-semibold">
              Terapeuta
            </label>
            <select
              className="text-xl"
              name="terapeutas"
              id="terapeutas"
              value={selectedTerapeuta}
              onChange={handleTerapeutaChange}
            >
              <option value="Todos">Todos</option>
              {terapeutas?.map((terapeuta) => (
                <option key={terapeuta.id} value={String(terapeuta.id)}>
                  {terapeuta.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-4 p-4 bg-white rounded shadow">
            <UsersThree size={24} />
            <span className="text-xl font-semibold">
              Total de Terapeutas: {terapeutas?.length || 0}
            </span>
          </div>
          <div className="flex items-center space-x-4 p-4 bg-white rounded shadow">
            <Users size={24} />
            <span className="text-xl font-semibold">
              Total de Pacientes: {pacientes?.length || 0}
            </span>
          </div>
        </div>
        {/* Table */}
        <div className="w-full overflow-x-auto rounded-lg shadow bg-white">
          <div className="min-w-full md:min-w-[1000px]">
            <table className="w-full">
              <thead className="bg-rosa text-white">
                <tr>
                  <th className="p-4 text-left">Nome</th>
                  <th className="p-4 text-left">Terapeuta</th>
                  <th className="p-4 text-left hidden md:table-cell">
                    Data de Nascimento
                  </th>
                  <th className="p-4 text-left hidden md:table-cell">
                    Responsável
                  </th>
                  <th className="p-4 text-left hidden lg:table-cell">
                    Telefone
                  </th>
                  <th className="p-4 text-left hidden lg:table-cell">Email</th>
                  <th className="p-4 text-left hidden lg:table-cell">Origem</th>
                  <th className="p-4 text-left hidden lg:table-cell">
                    Data de Entrada
                  </th>
                  <th className="p-4 text-left">Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPacientes.map((paciente) => (
                  <tr key={paciente.id}>
                    <td className="p-4">{paciente.nome}</td>
                    <td className="p-4">
                      {paciente.terapeutaInfo?.nome || "Não atribuído"}
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      {formatSafeDate(paciente.dtNascimento)}
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      {paciente.nomeResponsavel}
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      {paciente.telefoneResponsavel}
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      {paciente.emailResponsavel}
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      {paciente.origem}
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      {formatSafeDate(paciente.dt_entrada)}
                    </td>
                    <td className="p-2 space-x-2">
                      <button
                        type="button"
                        title="Editar Paciente"
                        className="text-green-500 hover:text-green-700"
                        onClick={() => handleEditPaciente(paciente)}
                      >
                        <PencilSimple size={20} weight="bold" />
                      </button>
                      <button
                        type="button"
                        title="Excluir Paciente"
                        onClick={() => handleDeleteClick(paciente)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <TrashSimple size={20} weight="bold" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />

        {/* Modals de edição e exclusão */}
        {editingPaciente && (
          <Dialog.Root
            open={!!editingPaciente}
            onOpenChange={() => setEditingPaciente(null)}
          >
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/60" />
              <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-md w-full bg-white p-6 rounded-lg shadow-lg">
                <Dialog.Title className="text-xl font-bold mb-4">
                  Editar Paciente
                </Dialog.Title>
                <p className="mb-4">
                  Formulário para edição de pacientes. O componente
                  EditarPacienteModal precisa ser implementado corretamente.
                </p>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setEditingPaciente(null)}
                    className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      handleEditSuccess();
                    }}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Salvar
                  </button>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        )}

        {deletingPaciente && (
          <Dialog.Root
            open={!!deletingPaciente}
            onOpenChange={() => setDeletingPaciente(null)}
          >
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/60" />
              <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-md w-full bg-white p-6 rounded-lg shadow-lg">
                <Dialog.Title className="text-xl font-bold mb-4">
                  Excluir Paciente
                </Dialog.Title>
                <p className="mb-4">
                  Tem certeza que deseja excluir o paciente{" "}
                  {deletingPaciente.nome}?
                </p>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setDeletingPaciente(null)}
                    className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      handleDeleteSuccess();
                    }}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    Excluir
                  </button>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        )}
      </main>
    </div>
  );
}
