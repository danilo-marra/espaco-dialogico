import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import Head from "next/head";
import useAuth from "../../../hooks/useAuth";
import { TrashSimple, PencilSimple } from "@phosphor-icons/react";

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
}

export default function UsersPage() {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form state para edição
  const [editForm, setEditForm] = useState({
    email: "",
    username: "",
    password: "",
    role: "",
  });

  // Redirecionar se não for admin - melhorado para considerar o estado de carregamento
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (!isAdmin) {
        router.push("/dashboard");
        toast.error("Acesso restrito a administradores");
      } else {
        fetchUsers();
      }
    }
  }, [isAuthenticated, isAdmin, router, loading]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const token = localStorage.getItem("authToken");
      console.log(
        "Token usado na requisição:",
        token ? "Disponível" : "Não disponível",
      );

      const response = await fetch("/api/v1/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Status da resposta:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erro na requisição:", errorData);
        throw new Error(errorData.error || "Falha ao carregar usuários");
      }

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Erro completo:", error);
      toast.error(
        error instanceof Error ? error.message : "Erro ao carregar usuários",
      );
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      email: user.email,
      username: user.username,
      password: "",
      role: user.role,
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const submitEditForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const token = localStorage.getItem("authToken");
      const payload: any = {};

      // Só incluir campos que foram modificados
      if (editForm.email !== selectedUser.email) payload.email = editForm.email;
      if (editForm.username !== selectedUser.username)
        payload.newUsername = editForm.username;
      if (editForm.role !== selectedUser.role) payload.role = editForm.role;
      if (editForm.password) payload.password = editForm.password;

      // Verificar se algo foi alterado
      if (Object.keys(payload).length === 0) {
        toast.info("Nenhuma alteração detectada");
        setIsEditModalOpen(false);
        return;
      }

      const response = await fetch(
        `/api/v1/admin/users/${selectedUser.username}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao atualizar usuário");
      }

      toast.success("Usuário atualizado com sucesso!");
      setIsEditModalOpen(false);
      fetchUsers(); // Recarregar a lista
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao atualizar usuário",
      );
    }
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `/api/v1/admin/users/${selectedUser.username}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao excluir usuário");
      }

      toast.success("Usuário excluído com sucesso!");
      setIsDeleteModalOpen(false);
      fetchUsers(); // Recarregar a lista
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao excluir usuário",
      );
    }
  };

  // Mostrar um estado de carregamento enquanto verifica a autenticação
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-medium mb-2">Carregando...</h2>
          <div className="w-8 h-8 border-4 border-t-azul rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado ou não for admin e não estiver mais carregando, não renderizar o conteúdo
  if ((!isAuthenticated || !isAdmin) && !loading) {
    return null; // Não renderizar nada enquanto redireciona
  }

  return (
    <>
      <Head>
        <title>Gerenciamento de Usuários - Espaço Dialógico</title>
      </Head>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6 text-azul">
          Gerenciamento de Usuários
        </h1>

        {loadingUsers ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-t-azul rounded-full animate-spin mx-auto"></div>
            <p className="mt-2">Carregando usuários...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Username
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Função
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Data de Criação
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`${
                            user.role === "admin"
                              ? "bg-purple-100 text-purple-800"
                              : user.role === "secretaria"
                                ? "bg-green-100 text-green-800"
                                : "bg-blue-100 text-blue-800"
                          } px-2 py-1 rounded-full text-xs font-medium`}
                        >
                          {user.role === "admin"
                            ? "Administrador"
                            : user.role === "secretaria"
                              ? "Secretaria"
                              : "Terapeuta"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(user.created_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title="Editar usuário"
                          >
                            <PencilSimple size={20} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="p-1 text-red-600 hover:text-red-800"
                            title="Excluir usuário"
                            disabled={
                              user.role === "admin" &&
                              user.username === "adminDanilo"
                            }
                          >
                            <TrashSimple size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Edição */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Editar Usuário</h2>
            <form onSubmit={submitEditForm} className="space-y-4">
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nome de Usuário
                </label>
                <input
                  id="username"
                  type="text"
                  value={editForm.username}
                  onChange={(e) =>
                    setEditForm({ ...editForm, username: e.target.value })
                  }
                  className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nova Senha (deixe em branco para manter a atual)
                </label>
                <input
                  id="password"
                  type="password"
                  value={editForm.password}
                  onChange={(e) =>
                    setEditForm({ ...editForm, password: e.target.value })
                  }
                  placeholder="Mínimo 8 caracteres"
                  className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
                />
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Função
                </label>
                <select
                  id="role"
                  value={editForm.role}
                  onChange={(e) =>
                    setEditForm({ ...editForm, role: e.target.value })
                  }
                  className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
                >
                  <option value="terapeuta">Terapeuta</option>
                  <option value="secretaria">Secretaria</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-azul text-white rounded text-sm font-medium hover:bg-azul/80"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {isDeleteModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Confirmar Exclusão</h2>
            <p className="mb-6">
              Tem certeza que deseja excluir o usuário{" "}
              <strong>{selectedUser.username}</strong>?
              <br />
              Esta ação não pode ser desfeita.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
