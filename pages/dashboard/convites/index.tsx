import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import Head from "next/head";
import useAuth from "../../../hooks/useAuth";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { X, EnvelopeSimple } from "@phosphor-icons/react";

interface Invite {
  id: string;
  code: string;
  email: string | null;
  role: string;
  created_at: string;
  expires_at: string;
  used: boolean;
  created_by: string | null;
  used_by: string | null;
  created_by_username: string | null;
  used_by_username: string | null;
}

export default function ConvitesPage() {
  const { user, loading } = useAuth();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isLoadingInvites, setIsLoadingInvites] = useState(true);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("terapeuta");
  const [expiresIn, setExpiresIn] = useState("7");
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);

  // Função para buscar todos os convites
  const fetchInvites = async () => {
    setIsLoadingInvites(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/v1/invites", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao carregar convites");
      }

      const data = await response.json();
      setInvites(data);
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível carregar os convites");
    } finally {
      setIsLoadingInvites(false);
    }
  };

  // Carregar convites ao montar o componente
  useEffect(() => {
    if (user && !loading) {
      fetchInvites();
    }
  }, [user, loading]);

  // Se não for admin, redirecionar para o dashboard
  if (user && user.role !== "admin") {
    toast.error("Você não tem permissão para acessar esta página");
    return null;
  }

  // Função para criar novo convite
  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingInvite(true);

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/v1/invites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: email || null,
          role,
          expiresInDays: parseInt(expiresIn, 10),
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao criar convite");
      }

      const newInvite = await response.json();
      setInvites([newInvite, ...invites]);

      // Enviar email automaticamente se um email foi fornecido
      if (email && email.trim()) {
        try {
          await sendInviteEmail(newInvite.id, email);
          // Apenas um toast quando o email é enviado com sucesso
          toast.success(`Convite criado e enviado para ${email}!`);
        } catch (emailError) {
          toast.success("Convite criado com sucesso!");
          toast.warning(
            "Email não pôde ser enviado automaticamente. Use o botão de envelope na tabela.",
          );
        }
      } else {
        toast.success("Convite criado com sucesso!");
      }

      setEmail("");
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível criar o convite");
    } finally {
      setIsCreatingInvite(false);
    }
  };

  // Função para excluir um convite
  const handleDeleteInvite = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este convite?")) {
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`/api/v1/invites/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao excluir convite");
      }

      setInvites(invites.filter((invite) => invite.id !== id));
      toast.success("Convite excluído com sucesso");
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível excluir o convite");
    }
  };

  // Função para copiar link de convite para a área de transferência
  const copyInviteLink = (code: string) => {
    const baseUrl = window.location.origin;
    const inviteLink = `${baseUrl}/register?code=${code}`;

    navigator.clipboard.writeText(inviteLink).then(
      () => {
        setCopySuccess(code);
        toast.success("Link copiado para a área de transferência");

        // Reset the "copied" state after 3 seconds
        setTimeout(() => {
          setCopySuccess(null);
        }, 3000);
      },
      () => {
        toast.error("Falha ao copiar o link");
      },
    );
  };

  // Função para enviar email com convite
  const sendInviteEmail = async (inviteId: string, inviteEmail: string) => {
    if (!inviteEmail) {
      toast.error("Este convite não possui um email associado");
      return;
    }

    setSendingEmail(inviteId);

    try {
      const token = localStorage.getItem("authToken");
      const requestData = {
        inviteId: inviteId,
      };

      const response = await fetch("/api/v1/invites/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao enviar email");
      }

      await response.json();
      // Remover toast daqui para evitar duplicação quando chamado do handleCreateInvite
      // toast.success(`Email enviado com sucesso para ${inviteEmail}`);

      // Atualizar a lista de convites para refletir o envio
      fetchInvites();
    } finally {
      setSendingEmail(null);
    }
  };

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

  return (
    <>
      <Head>
        <title>Gerenciar Convites - Espaço Dialógico</title>
      </Head>

      {/* Overlay de carregamento */}
      {isCreatingInvite && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <div className="w-12 h-12 border-4 border-t-azul rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {email ? "Criando e enviando convite..." : "Criando convite..."}
            </h3>
            <p className="text-gray-600">Por favor, aguarde...</p>
          </div>
        </div>
      )}

      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4 text-azul">
          Gerenciar Convites
        </h1>

        {/* Formulário para criar novo convite */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-medium mb-4">Criar Novo Convite</h2>

          <form onSubmit={handleCreateInvite} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4"
                placeholder="Digite o email do convidado"
                required
              />
              <p className="text-sm text-gray-600 mt-1">
                💡 Se você informar um email, o convite será enviado
                automaticamente
              </p>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium mb-1">
                Função
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4"
              >
                <option value="terapeuta">Terapeuta</option>
                <option value="secretaria">Secretaria</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="expiresIn"
                className="block text-sm font-medium mb-1"
              >
                Expira em (dias)
              </label>
              <input
                type="number"
                id="expiresIn"
                value={expiresIn}
                onChange={(e) => setExpiresIn(e.target.value)}
                className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4"
                min="1"
                max="30"
              />
            </div>

            <button
              type="submit"
              className="bg-azul text-white px-4 py-2 rounded hover:bg-azul/80"
              disabled={isCreatingInvite}
            >
              {isCreatingInvite
                ? "Gerando..."
                : email
                  ? "Gerar e Enviar Convite"
                  : "Gerar Convite"}
            </button>
          </form>
        </div>

        {/* Lista de convites */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Convites</h2>

          {isLoadingInvites ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-t-azul rounded-full animate-spin mx-auto"></div>
              <p className="mt-2">Carregando convites...</p>
            </div>
          ) : invites.length === 0 ? (
            <p className="text-center py-8 text-gray-500">
              Nenhum convite encontrado
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Função
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Criado por
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Expira em
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase text-start">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invites.map((invite) => (
                    <tr
                      key={invite.id}
                      className={invite.used ? "bg-gray-50" : ""}
                    >
                      <td className="px-6 py-4 whitespace-nowrap font-mono">
                        {invite.code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {invite.email || (
                          <span className="text-gray-400">Qualquer email</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`${
                            invite.role === "admin"
                              ? "bg-purple-100 text-purple-800"
                              : invite.role === "secretaria"
                                ? "bg-green-100 text-green-800"
                                : "bg-blue-100 text-blue-800"
                          } px-2 py-1 rounded-full text-xs font-medium`}
                        >
                          {invite.role === "admin"
                            ? "Administrador"
                            : invite.role === "secretaria"
                              ? "Secretaria"
                              : "Terapeuta"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {invite.created_by_username || "Sistema"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          title={format(new Date(invite.expires_at), "PPpp", {
                            locale: ptBR,
                          })}
                        >
                          {formatDistanceToNow(new Date(invite.expires_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {invite.used ? (
                          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                            Usado por {invite.used_by_username || "Usuário"}
                          </span>
                        ) : new Date(invite.expires_at) < new Date() ? (
                          <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-medium">
                            Expirado
                          </span>
                        ) : (
                          <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs font-medium">
                            Ativo
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                        <div className="flex justify-start space-x-2">
                          {!invite.used &&
                            new Date(invite.expires_at) >= new Date() && (
                              <>
                                <button
                                  onClick={() => copyInviteLink(invite.code)}
                                  className="text-blue-600 hover:text-blue-800"
                                  title="Copiar link de convite"
                                >
                                  {copySuccess === invite.code
                                    ? "Copiado!"
                                    : "Copiar link"}
                                </button>
                                {invite.email && (
                                  <button
                                    onClick={async () => {
                                      try {
                                        await sendInviteEmail(
                                          invite.id,
                                          invite.email,
                                        );
                                        toast.success(
                                          `Email enviado com sucesso para ${invite.email}`,
                                        );
                                      } catch (error) {
                                        toast.error(
                                          error instanceof Error
                                            ? error.message
                                            : "Não foi possível enviar o email",
                                        );
                                      }
                                    }}
                                    className="text-green-600 hover:text-green-800 flex items-center space-x-1"
                                    title="Enviar convite por email"
                                    disabled={sendingEmail === invite.id}
                                  >
                                    {sendingEmail === invite.id ? (
                                      <div className="w-4 h-4 border-2 border-t-green-600 rounded-full animate-spin"></div>
                                    ) : (
                                      <EnvelopeSimple size={18} />
                                    )}
                                  </button>
                                )}
                              </>
                            )}
                          <button
                            onClick={() => handleDeleteInvite(invite.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Excluir convite"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
