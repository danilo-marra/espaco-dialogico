import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [inviteInfo, setInviteInfo] = useState<{
    email: string | null;
    role: string;
  } | null>(null);
  const [isLoadingInvite, setIsLoadingInvite] = useState(false);
  const router = useRouter();

  // Função para buscar informações do convite
  const fetchInviteInfo = async (code: string) => {
    if (!code) return;

    setIsLoadingInvite(true);
    try {
      const response = await fetch(`/api/v1/invites/info/${code}`);
      const data = await response.json();

      if (response.ok) {
        setInviteInfo(data);
        // Se o convite tem um email específico, pré-preencher o campo
        if (data.email) {
          setEmail(data.email);
        }
      } else {
        // Se há erro no convite, mostrar mensagem
        toast.error(data.error || "Código de convite inválido");
        setInviteInfo(null);
        setEmail("");
      }
    } catch (error) {
      console.error("Erro ao buscar informações do convite:", error);
      toast.error("Erro ao validar código de convite");
      setInviteInfo(null);
      setEmail("");
    } finally {
      setIsLoadingInvite(false);
    }
  };

  useEffect(() => {
    const { code } = router.query;
    if (code && typeof code === "string") {
      setInviteCode(code);
      fetchInviteInfo(code);
    }
  }, [router.query]);

  // Função para lidar com mudanças no código de convite
  const handleInviteCodeChange = (value: string) => {
    const upperValue = value.toUpperCase();
    setInviteCode(upperValue);

    // Se o código tem 8 caracteres (tamanho padrão), buscar informações
    if (upperValue.length === 8) {
      fetchInviteInfo(upperValue);
    } else {
      // Limpar informações se código incompleto
      setInviteInfo(null);
      if (!inviteInfo?.email) {
        setEmail("");
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !confirmPassword || !inviteCode) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/v1/users/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          name,
          email,
          password,
          inviteCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Erro ao registrar usuário",
        );
      }

      toast.success("Conta criada com sucesso! Faça login para continuar.");
      router.push("/login");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao registrar usuário",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col justify-center p-6 sm:px-6 lg:px-8">
      <Head>
        <title>Registro - Espaço Dialógico</title>
      </Head>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center">
          <Image
            src="/img/logov2.png"
            alt="Logo Espaço Dialógico"
            width={220}
            height={120}
            priority
            className="my-4"
          />
        </div>
        <h2 className="text-center text-2xl font-bold tracking-tight text-azul">
          Crie sua conta
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Para se registrar, você precisa de um código de convite válido
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleRegister}>
            <div>
              <label
                htmlFor="inviteCode"
                className="block text-sm font-medium text-gray-700"
              >
                Código de Convite <span className="text-red-500">*</span>
              </label>
              <input
                id="inviteCode"
                name="inviteCode"
                type="text"
                value={inviteCode}
                onChange={(e) => handleInviteCodeChange(e.target.value)}
                className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
                required
              />
              {isLoadingInvite && (
                <p className="text-xs text-blue-500 mt-1">
                  Validando código de convite...
                </p>
              )}
              {inviteInfo && (
                <p className="text-xs text-green-600 mt-1">
                  ✅ Código válido - Convite para {inviteInfo.role}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                readOnly={!!inviteInfo?.email}
                className={`shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px] ${
                  inviteInfo?.email ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {inviteInfo?.email
                  ? "Este email foi pré-definido no convite e não pode ser alterado"
                  : "Você usará o email para fazer login no sistema"}
              </p>
            </div>

            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700"
              >
                Nome
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Senha <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
                required
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirme a senha <span className="text-red-500">*</span>
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
                required
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center rounded-md bg-azul px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-azul/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                {isLoading ? "Registrando..." : "Registrar"}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Já tem uma conta?{" "}
              <Link
                href="/login"
                className="font-medium text-azul hover:text-azul/75"
              >
                Faça login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
