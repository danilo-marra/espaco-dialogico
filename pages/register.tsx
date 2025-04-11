import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";

export default function Register() {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const { code } = router.query;
    if (code && typeof code === "string") {
      setInviteCode(code);
    }
  }, [router.query]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword || !inviteCode) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/v1/users", {
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
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
                required
              />
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
                className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Você usará o email para fazer login no sistema
              </p>
            </div>

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Nome Completo
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
                placeholder="Seu nome completo"
              />
            </div>

            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700"
              >
                Nome de usuário
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
