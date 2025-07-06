import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import Head from "next/head";
import Image from "next/image";
import useAuth from "../../hooks/useAuth";
import { Terapeuta } from "../../tipos";
import { PDFUploader } from "../../components/common/PDFUploader";

export default function PerfilPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Estados para dados do terapeuta
  const [terapeutaData, setTerapeutaData] = useState<Terapeuta | null>(null);
  const [isLoadingTerapeuta, setIsLoadingTerapeuta] = useState(false);
  const [isEditingTerapeuta, setIsEditingTerapeuta] = useState(false);

  // Redirecionar para login se não estiver autenticado, mas apenas após o carregamento inicial
  React.useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router, loading]);

  // Buscar dados do terapeuta se a role for "terapeuta"
  useEffect(() => {
    const fetchTerapeutaData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const response = await fetch(`/api/v1/terapeutas/by-user/${user?.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setTerapeutaData(data);

          // Se for um novo registro (primeiro acesso), entrar em modo de edição
          if (data.isNew) {
            setIsEditingTerapeuta(true);
          }
        } else if (response.status === 404) {
          // Terapeuta não encontrado, pode ser primeiro acesso
          setIsEditingTerapeuta(true);
        }
      } catch (error) {
        console.error("Erro ao buscar dados do terapeuta:", error);
      }
    };

    if (user?.role === "terapeuta" && user?.id) {
      fetchTerapeutaData();
    }
  }, [user]);

  const handleTerapeutaSubmit = async (formData: FormData) => {
    setIsLoadingTerapeuta(true);
    try {
      const token = localStorage.getItem("authToken");

      const response = await fetch(`/api/v1/terapeutas/by-user/${user?.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Erro ao salvar dados do terapeuta",
        );
      }

      const updatedTerapeuta = await response.json();
      setTerapeutaData(updatedTerapeuta);
      setIsEditingTerapeuta(false);
      toast.success("Dados atualizados com sucesso!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao salvar dados",
      );
    } finally {
      setIsLoadingTerapeuta(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Todos os campos são obrigatórios");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("A nova senha deve ter pelo menos 8 caracteres");
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem("authToken");

      const response = await fetch("/api/v1/users/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao alterar senha");
      }

      toast.success("Senha alterada com sucesso!");
      // Limpar formulário
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao alterar senha",
      );
    } finally {
      setIsLoading(false);
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

  // Se não estiver autenticado e não estiver mais carregando, não renderizar o conteúdo
  if (!isAuthenticated && !loading) {
    return null; // Não renderizar nada enquanto redireciona
  }

  if (!user) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <Head>
        <title>Perfil - Espaço Dialógico</title>
      </Head>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6 text-azul">Meu Perfil</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Informações da Conta</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Nome de usuário</p>
              <p className="font-medium">{user?.username}</p>
            </div>
            <div>
              <p className="text-gray-600">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div>
              <p className="text-gray-600">Função</p>
              <p className="font-medium capitalize">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Seção específica para terapeutas */}
        {user?.role === "terapeuta" && (
          <TerapeutaProfileSection
            terapeutaData={terapeutaData}
            isEditing={isEditingTerapeuta}
            isLoading={isLoadingTerapeuta}
            onEdit={() => setIsEditingTerapeuta(true)}
            onCancel={() => setIsEditingTerapeuta(false)}
            onSubmit={handleTerapeutaSubmit}
            user={user} // Passa user como prop
          />
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Alterar Senha</h2>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div>
              <label
                htmlFor="currentPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Senha Atual
              </label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
              />
            </div>

            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nova Senha
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirmar Senha
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="bg-azul text-white px-4 py-2 rounded hover:bg-azul/80"
            >
              {isLoading ? "Alterando..." : "Alterar Senha"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

// Componente específico para o perfil do terapeuta
interface TerapeutaProfileSectionProps {
  terapeutaData: Terapeuta | null;
  isEditing: boolean;
  isLoading: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSubmit: (_formData: FormData) => Promise<void>;
  user: any; // Adicionado user como prop
}

function TerapeutaProfileSection({
  terapeutaData,
  isEditing,
  isLoading,
  onEdit,
  onCancel,
  onSubmit,
  user, // Recebe user
}: TerapeutaProfileSectionProps) {
  const [formData, setFormData] = useState({
    nome: terapeutaData?.nome || "",
    telefone: terapeutaData?.telefone || "",
    email: terapeutaData?.email || "",
    crp: terapeutaData?.crp || "",
    dt_nascimento: terapeutaData?.dt_nascimento
      ? new Date(terapeutaData.dt_nascimento).toISOString().split("T")[0]
      : "",
    dt_entrada: terapeutaData?.dt_entrada
      ? new Date(terapeutaData.dt_entrada).toISOString().split("T")[0]
      : "",
    chave_pix: terapeutaData?.chave_pix || "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPDF, setSelectedPDF] = useState<File | null>(null);

  useEffect(() => {
    if (terapeutaData) {
      setFormData({
        nome: terapeutaData.nome || "",
        telefone: terapeutaData.telefone || "",
        email: terapeutaData.email || "",
        crp: terapeutaData.crp || "",
        dt_nascimento: terapeutaData.dt_nascimento
          ? new Date(terapeutaData.dt_nascimento).toISOString().split("T")[0]
          : "",
        dt_entrada: terapeutaData.dt_entrada
          ? new Date(terapeutaData.dt_entrada).toISOString().split("T")[0]
          : "",
        chave_pix: terapeutaData.chave_pix || "",
      });
    }
  }, [terapeutaData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const submitFormData = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      submitFormData.append(key, value);
    });

    if (selectedFile) {
      submitFormData.append("foto", selectedFile);
    }

    if (selectedPDF) {
      submitFormData.append("curriculo_arquivo", selectedPDF);
    }

    await onSubmit(submitFormData);
  };

  if (!isEditing && !terapeutaData) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Dados Profissionais</h2>
        <p className="text-gray-600 mb-4">
          Complete seu perfil profissional para começar a usar o sistema.
        </p>
        <button
          onClick={onEdit}
          className="bg-azul text-white px-4 py-2 rounded hover:bg-azul/80"
        >
          Completar Perfil
        </button>
      </div>
    );
  }

  if (!isEditing && terapeutaData?.isNew) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Dados Profissionais</h2>
        <p className="text-gray-600 mb-4">
          Complete seu perfil profissional para começar a usar o sistema.
        </p>
        <button
          onClick={onEdit}
          className="bg-azul text-white px-4 py-2 rounded hover:bg-azul/80"
        >
          Completar Perfil
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Dados Profissionais</h2>
        {!isEditing && terapeutaData && (
          <button
            onClick={onEdit}
            className="bg-azul text-white px-4 py-2 rounded hover:bg-azul/80"
          >
            Editar
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                className={`shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px] ${
                  terapeutaData?.isNew ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
                disabled={terapeutaData?.isNew}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone *
              </label>
              <input
                type="text"
                value={formData.telefone}
                onChange={(e) =>
                  setFormData({ ...formData, telefone: e.target.value })
                }
                className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
                placeholder="(11) 99999-9999"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className={`shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px] ${
                  terapeutaData?.isNew ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
                disabled={terapeutaData?.isNew}
                placeholder="seuemail@exemplo.com"
                required
              />
              {terapeutaData?.isNew && (
                <p className="text-sm text-gray-500 mt-1">
                  Email importado do sistema de usuários
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CRP
              </label>
              <input
                type="text"
                value={formData.crp}
                onChange={(e) =>
                  setFormData({ ...formData, crp: e.target.value })
                }
                className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
                placeholder="Ex: 01/123456"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de Nascimento
              </label>
              <input
                type="date"
                value={formData.dt_nascimento}
                onChange={(e) =>
                  setFormData({ ...formData, dt_nascimento: e.target.value })
                }
                className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de Entrada na Clínica *
              </label>
              <input
                type="date"
                value={formData.dt_entrada}
                onChange={(e) =>
                  setFormData({ ...formData, dt_entrada: e.target.value })
                }
                className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px] disabled:bg-gray-100 disabled:cursor-not-allowed"
                required
                disabled={user?.role === "terapeuta"}
              />
              {user?.role === "terapeuta" && (
                <p className="text-xs text-gray-500 mt-1">
                  Este campo só pode ser alterado por um usuário com perfil{" "}
                  <b>Administrador</b> ou <b>Secretaria</b>.
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chave PIX *
            </label>
            <input
              type="text"
              value={formData.chave_pix}
              onChange={(e) =>
                setFormData({ ...formData, chave_pix: e.target.value })
              }
              className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
              placeholder="CPF, email, telefone ou chave aleatória"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Foto do Perfil
            </label>
            {terapeutaData?.foto && (
              <div className="mb-2">
                <Image
                  src={terapeutaData.foto}
                  alt="Foto atual"
                  width={80}
                  height={80}
                  className="rounded-full object-cover"
                />
                <p className="text-sm text-gray-500 mt-1">Foto atual</p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="shadow-rosa/50 focus:shadow-rosa block w-full rounded-md px-4 py-2 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
            />
            <p className="text-sm text-gray-500 mt-1">
              Formatos aceitos: JPG, PNG, GIF. Tamanho máximo: 10MB
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Currículo em PDF
            </label>
            {terapeutaData?.curriculo_arquivo && (
              <div className="mb-2">
                <a
                  href={`/api/download/curriculo/${terapeutaData.id}`}
                  download
                  className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                >
                  <span>📄</span>
                  <span>Baixar currículo atual</span>
                </a>
              </div>
            )}
            <PDFUploader
              onFileSelect={(file) => setSelectedPDF(file)}
              maxSize={10 * 1024 * 1024} // 10MB em bytes
              label="Arraste seu currículo em PDF aqui ou clique para selecionar"
            />
            <p className="text-sm text-gray-500 mt-1">
              Formato aceito: PDF. Tamanho máximo: 10MB
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-azul text-white px-4 py-2 rounded hover:bg-azul/80 disabled:opacity-50"
            >
              {isLoading ? "Salvando..." : "Salvar"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {terapeutaData?.foto && (
            <div className="md:col-span-2 mb-4">
              <Image
                src={terapeutaData.foto}
                alt="Foto do perfil"
                width={96}
                height={96}
                className="rounded-full object-cover"
              />
            </div>
          )}
          <div>
            <p className="text-gray-600">Nome</p>
            <p className="font-medium">{terapeutaData?.nome}</p>
          </div>
          <div>
            <p className="text-gray-600">Telefone</p>
            <p className="font-medium">{terapeutaData?.telefone}</p>
          </div>
          <div>
            <p className="text-gray-600">Email</p>
            <p className="font-medium">{terapeutaData?.email}</p>
          </div>
          <div>
            <p className="text-gray-600">CRP</p>
            <p className="font-medium">{terapeutaData?.crp || "-"}</p>
          </div>
          <div>
            <p className="text-gray-600">Data de Nascimento</p>
            <p className="font-medium">
              {terapeutaData?.dt_nascimento
                ? new Date(terapeutaData.dt_nascimento).toLocaleDateString(
                    "pt-BR",
                  )
                : "-"}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Data de Entrada</p>
            <p className="font-medium">
              {terapeutaData?.dt_entrada
                ? new Date(terapeutaData.dt_entrada).toLocaleDateString("pt-BR")
                : "-"}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Chave PIX</p>
            <p className="font-medium">{terapeutaData?.chave_pix}</p>
          </div>
          {terapeutaData?.curriculo_arquivo && (
            <div className="md:col-span-2">
              <p className="text-gray-600">Currículo PDF</p>
              <a
                href={`/api/download/curriculo/${terapeutaData.id}`}
                download
                className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 hover:underline transition-colors"
              >
                <span>📄</span>
                <span>Baixar currículo em PDF</span>
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
