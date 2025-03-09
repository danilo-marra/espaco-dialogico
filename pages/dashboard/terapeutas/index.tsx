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
import { DeletarTerapeutaModal } from "components/Terapeuta/DeletarTerapeutaModal";
import { EditarTerapeutaModal } from "components/Terapeuta/EditarTerapeutaModal";
import { NovoTerapeutaModal } from "components/Terapeuta/NovoTerapeutaModal";
import { useFetchTerapeutas } from "hooks/useFetchTerapeutas";
import Head from "next/head";
import Image from "next/image";
import React, { useMemo, useState } from "react";
import type { Terapeuta } from "tipos";
import { dateFormatter } from "utils/formatter";

const TERAPEUTAS_PER_PAGE = 10;

const filterTerapeutas = (
  terapeutas: Terapeuta[],
  selectedTerapeuta: string,
): Terapeuta[] => {
  return terapeutas.filter(
    (terapeuta) =>
      selectedTerapeuta === "Todos" ||
      String(terapeuta.idTerapeuta) === String(selectedTerapeuta),
  );
};

export default function Terapeutas() {
  const { terapeutas, isLoading, isError, mutate } = useFetchTerapeutas();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTerapeuta, setSelectedTerapeuta] = useState("Todos");
  const [editingTerapeuta, setEditingTerapeuta] = useState<Terapeuta | null>(
    null,
  );
  const [deletingTerapeuta, setDeletingTerapeuta] = useState<Terapeuta | null>(
    null,
  );

  const handleEditTerapeuta = (terapeuta: Terapeuta) => {
    setEditingTerapeuta(terapeuta);
  };

  const handleEditSuccess = () => {
    mutate();
    setEditingTerapeuta(null);
  };

  const handleDeleteClick = (terapeuta: Terapeuta) => {
    setDeletingTerapeuta(terapeuta);
  };

  const handleDeleteSuccess = () => {
    mutate();
    setDeletingTerapeuta(null);
  };

  // Filtrar terapeutas
  const filteredTerapeutas = useMemo(
    () => (terapeutas ? filterTerapeutas(terapeutas, selectedTerapeuta) : []),
    [terapeutas, selectedTerapeuta],
  );

  // Paginação
  const paginatedTerapeutas = useMemo(() => {
    const startIndex = (currentPage - 1) * TERAPEUTAS_PER_PAGE;
    return filteredTerapeutas.slice(
      startIndex,
      startIndex + TERAPEUTAS_PER_PAGE,
    );
  }, [filteredTerapeutas, currentPage]);

  // Show loading state
  if (isLoading) return <div>Carregando...</div>;

  // Show error state
  if (isError) return <div>Erro ao carregar dados.</div>;

  const totalPages = Math.ceil(filteredTerapeutas.length / TERAPEUTAS_PER_PAGE);

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
        <title>Terapeutas</title>
      </Head>
      <main className="flex-1 bg-gray-100 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Terapeutas</h1>
          <Dialog.Root>
            <Dialog.Trigger asChild>
              <button
                type="button"
                className="flex items-center bg-azul text-white px-4 py-2 rounded hover:bg-sky-600 duration-150"
              >
                <Plus size={20} weight="bold" className="mr-2" />
                Novo Terapeuta
              </button>
            </Dialog.Trigger>
            <NovoTerapeutaModal onSuccess={() => mutate()} />
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
                <option
                  key={terapeuta.idTerapeuta}
                  value={String(terapeuta.idTerapeuta)}
                >
                  {terapeuta.nomeTerapeuta}
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
              {/* Total de Pacientes: {pacientes.length} */}
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
                  <th className="p-4 text-left">Foto</th>
                  <th className="p-4 text-left hidden md:table-cell">
                    Telefone
                  </th>
                  <th className="p-4 text-left hidden md:table-cell">Email</th>
                  <th className="p-4 text-left hidden lg:table-cell">
                    Endereço
                  </th>
                  <th className="p-4 text-left hidden lg:table-cell">
                    Data de Entrada
                  </th>
                  <th className="p-4 text-left hidden lg:table-cell">
                    Chave PIX
                  </th>
                  <th className="p-4 text-left">Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTerapeutas.map((terapeuta) => (
                  <tr key={terapeuta.idTerapeuta}>
                    <td className="p-4">{terapeuta.nomeTerapeuta}</td>
                    <td className="p-4">
                      {typeof terapeuta.fotoTerapeuta === "string" ? (
                        <Image
                          src={terapeuta.fotoTerapeuta}
                          alt={terapeuta.nomeTerapeuta}
                          className="w-10 h-10 rounded-full object-cover aspect-square"
                          width={40}
                          height={40}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <User size={24} className="text-white" />
                        </div>
                      )}
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      {terapeuta.telefoneTerapeuta}
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      {terapeuta.emailTerapeuta}
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      {terapeuta.enderecoTerapeuta}
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      {dateFormatter.format(
                        new Date(terapeuta.dt_entradaTerapeuta),
                      )}
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      {terapeuta.chave_pixTerapeuta}
                    </td>
                    <td className="p-2 space-x-2">
                      <button
                        type="button"
                        title="Editar Terapeuta"
                        className="text-green-500 hover:text-green-700"
                        onClick={() => handleEditTerapeuta(terapeuta)}
                      >
                        <PencilSimple size={20} weight="bold" />
                      </button>
                      <button
                        type="button"
                        title="Excluir Terapeuta"
                        onClick={() => handleDeleteClick(terapeuta)}
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

        {/* Modals */}
        {deletingTerapeuta && (
          <DeletarTerapeutaModal
            terapeuta={deletingTerapeuta}
            open={!!deletingTerapeuta}
            onClose={() => setDeletingTerapeuta(null)}
            onSuccess={handleDeleteSuccess}
          />
        )}

        {editingTerapeuta && (
          <EditarTerapeutaModal
            terapeuta={editingTerapeuta}
            open={!!editingTerapeuta}
            onClose={() => setEditingTerapeuta(null)}
            onSuccess={handleEditSuccess}
          />
        )}
      </main>
    </div>
  );
}
