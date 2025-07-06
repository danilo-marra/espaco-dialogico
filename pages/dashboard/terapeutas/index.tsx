import {
  Eye,
  PencilSimple,
  Plus,
  TrashSimple,
  User,
  UserCircle,
  Users,
  UsersThree,
} from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import Pagination from "components/Pagination";
import { DeletarTerapeutaModal } from "components/Terapeuta/DeletarTerapeutaModal";
import { EditarTerapeutaModal } from "components/Terapeuta/EditarTerapeutaModal";
import { NovoTerapeutaModal } from "components/Terapeuta/NovoTerapeutaModal";
import { useFetchPacientes } from "hooks/useFetchPacientes";
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
  // Primeiro ordenamos os terapeutas (do mais recente para o mais antigo)
  return terapeutas
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
    .filter(
      (terapeuta) =>
        selectedTerapeuta === "Todos" ||
        String(terapeuta.id) === String(selectedTerapeuta),
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
  const [isNewTerapeutaOpen, setIsNewTerapeutaOpen] = useState(false);

  const { pacientes } = useFetchPacientes();
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

  function renderFoto(fotoUrl) {
    if (fotoUrl) {
      return (
        <Image
          src={fotoUrl}
          alt="Foto do terapeuta"
          width={50}
          height={50}
          className="rounded-full object-cover"
        />
      );
    }

    // Fallback para quando não há foto
    return (
      <div className="w-[50px] h-[50px] bg-gray-200 rounded-full flex items-center justify-center">
        <UserCircle size={60} weight="thin" className="text-gray-400" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Head>
        <title>Terapeutas</title>
      </Head>
      <main className="flex-1 bg-gray-100 p-4 min-w-0 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col space-y-4 mb-6 sm:flex-row sm:space-y-0 sm:items-center sm:justify-between">
          <h1 className="text-xl font-semibold sm:text-2xl">Terapeutas</h1>
          <Dialog.Root
            open={isNewTerapeutaOpen}
            onOpenChange={setIsNewTerapeutaOpen}
          >
            <Dialog.Trigger asChild>
              <button
                type="button"
                className="flex items-center justify-center bg-azul text-white px-4 py-3 rounded hover:bg-sky-600 duration-150 w-full sm:w-auto"
              >
                <Plus size={20} weight="bold" className="mr-2" />
                <span className="sm:inline">Novo Terapeuta</span>
              </button>
            </Dialog.Trigger>
            <NovoTerapeutaModal
              onSuccess={() => mutate()}
              onClose={() => setIsNewTerapeutaOpen(false)}
            />
          </Dialog.Root>
        </div>

        {/* Filters and Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
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
                {filteredTerapeutas.length}
              </span>
              <span className="text-sm text-gray-500 ml-1">
                de {terapeutas?.length || 0}
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
                {pacientes?.length || 0}
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
                  <th className="p-3 text-left text-sm font-medium">Foto</th>
                  <th className="p-3 text-left text-sm font-medium hidden lg:table-cell">
                    Telefone
                  </th>
                  <th className="p-3 text-left text-sm font-medium hidden lg:table-cell">
                    Email
                  </th>
                  <th className="p-3 text-left text-sm font-medium hidden xl:table-cell">
                    CRP
                  </th>
                  <th className="p-3 text-left text-sm font-medium hidden xl:table-cell">
                    Data de Nascimento
                  </th>
                  <th className="p-3 text-left text-sm font-medium hidden xl:table-cell">
                    Data de Entrada
                  </th>
                  <th className="p-3 text-left text-sm font-medium hidden 2xl:table-cell">
                    Currículo PDF
                  </th>
                  <th className="p-3 text-left text-sm font-medium hidden 2xl:table-cell">
                    Chave PIX
                  </th>
                  <th className="p-3 text-center text-sm font-medium sticky right-0 bg-rosa">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedTerapeutas.map((terapeuta, index) => (
                  <tr
                    key={terapeuta.id}
                    className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                  >
                    <td className="p-3">
                      <div className="font-medium text-gray-900 text-sm lg:text-base">
                        {terapeuta.nome}
                      </div>
                      {/* Informações extras em telas menores */}
                      <div className="lg:hidden mt-1 space-y-1">
                        {terapeuta.telefone && (
                          <div className="text-xs text-gray-500">
                            Tel: {terapeuta.telefone}
                          </div>
                        )}
                        {terapeuta.email && (
                          <div className="text-xs text-gray-600">
                            {terapeuta.email}
                          </div>
                        )}
                        {terapeuta.crp && (
                          <div className="xl:hidden text-xs text-gray-500">
                            CRP: {terapeuta.crp}
                          </div>
                        )}
                        {terapeuta.dt_nascimento && (
                          <div className="xl:hidden text-xs text-gray-500">
                            Nascimento:{" "}
                            {new Date(
                              terapeuta.dt_nascimento,
                            ).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex-shrink-0">
                        {renderFoto(terapeuta.foto)}
                      </div>
                    </td>
                    <td className="p-3 hidden lg:table-cell text-sm text-gray-600">
                      {terapeuta.telefone ? (
                        <a
                          href={`tel:${terapeuta.telefone}`}
                          className="text-azul hover:underline"
                        >
                          {terapeuta.telefone}
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-3 hidden lg:table-cell text-sm text-gray-600">
                      {terapeuta.email ? (
                        <a
                          href={`mailto:${terapeuta.email}`}
                          className="text-azul hover:underline max-w-[200px] truncate block"
                          title={terapeuta.email}
                        >
                          {terapeuta.email}
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-3 hidden xl:table-cell text-sm text-gray-600">
                      {terapeuta.crp || (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-3 hidden xl:table-cell text-sm text-gray-600">
                      {terapeuta.dt_nascimento ? (
                        dateFormatter.format(new Date(terapeuta.dt_nascimento))
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-3 hidden xl:table-cell text-sm text-gray-600">
                      {terapeuta.dt_entrada ? (
                        dateFormatter.format(new Date(terapeuta.dt_entrada))
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-3 hidden 2xl:table-cell text-sm text-gray-600">
                      {terapeuta.curriculo_arquivo ? (
                        <a
                          href={`/api/download/curriculo/${terapeuta.id}`}
                          download
                          className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                          title="Baixar currículo em PDF"
                        >
                          <Eye
                            size={16}
                            weight="bold"
                            className="flex-shrink-0"
                          />
                          <span>Baixar PDF</span>
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-3 hidden 2xl:table-cell text-sm text-gray-600">
                      {terapeuta.chave_pix || (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-3 sticky right-0 bg-white">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          type="button"
                          title="Editar Terapeuta"
                          className="text-green-500 hover:text-green-700 p-2 rounded-md hover:bg-green-50 transition-all duration-200"
                          onClick={() => handleEditTerapeuta(terapeuta)}
                        >
                          <PencilSimple size={16} weight="bold" />
                        </button>
                        <button
                          type="button"
                          title="Excluir Terapeuta"
                          onClick={() => handleDeleteClick(terapeuta)}
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

          {/* Mensagem quando não há terapeutas */}
          {paginatedTerapeutas.length === 0 && (
            <div className="text-center py-12 px-4">
              <div className="max-w-md mx-auto">
                <UsersThree size={64} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhum terapeuta encontrado
                </h3>
                <p className="text-gray-600 mb-6">
                  {selectedTerapeuta !== "Todos"
                    ? "Tente ajustar os filtros de busca para encontrar o que está procurando."
                    : "Comece adicionando seu primeiro terapeuta ao sistema."}
                </p>
                {selectedTerapeuta === "Todos" && (
                  <button
                    type="button"
                    onClick={() => setIsNewTerapeutaOpen(true)}
                    className="inline-flex items-center px-4 py-2 bg-azul text-white rounded-md hover:bg-sky-600 transition-colors"
                  >
                    <Plus size={20} weight="bold" className="mr-2" />
                    Adicionar Primeiro Terapeuta
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
