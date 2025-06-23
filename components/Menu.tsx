import {
  CalendarBlank,
  CalendarCheck,
  House,
  List,
  Money,
  Person,
  SignOut,
  UsersThree,
  EnvelopeSimple,
  User,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { usePermissions } from "../hooks/usePermissions";

const Menu = () => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const router = useRouter();
  const { hasPermission, checkCurrentRoutePermission } = usePermissions();

  useEffect(() => {
    const handleRouteChange = () => {
      setIsMenuOpen(false);
    };

    router.events.on("routeChangeComplete", handleRouteChange);

    // Verificar permissões da rota atual
    checkCurrentRoutePermission();

    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events, checkCurrentRoutePermission]);

  const handleLogout = () => {
    // Remover dados de autenticação do localStorage
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");

    // Notificar o usuário
    toast.success("Logout realizado com sucesso");

    // Redirecionar para a página de login
    router.push("/login");
  };

  return (
    <div>
      <button
        type="button"
        className={`fixed top-5 left-5 md:hidden focus:outline-none z-40 ${
          isMenuOpen ? "text-white" : "text-gray-500"
        }`}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        <List size={24} weight="bold" />
      </button>
      <aside
        data-testid="menu-component"
        className={`fixed h-screen md:h-auto md:sticky top-0 w-64 bg-azul text-white flex flex-col z-30
          ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 transition-transform duration-300 ease-in-out`}
        style={{ minHeight: "100vh" }}
      >
        <div className="p-6 flex-shrink-0">
          <Image
            src="/img/logo2.png"
            alt="Logo Espaço Dialógico"
            width={220}
            height={120}
            priority
          />
          <span className="block mb-4 text-2xl font-bold">
            Espaço Dialógico
          </span>
        </div>

        <div className="overflow-y-auto flex-grow pb-6 px-6">
          <ul className="menu space-y-4">
            <li className="hover:text-blue-300 cursor-pointer">
              <Link
                href="/dashboard"
                className="flex items-center space-x-2 w-full"
              >
                <House weight="fill" size={24} />
                <span>Home</span>
              </Link>
            </li>
            <hr />
            {hasPermission("agendamentos") && (
              <>
                <li className="hover:text-blue-300 cursor-pointer">
                  <Link
                    href="/dashboard/agenda"
                    className="flex items-center space-x-2 w-full"
                  >
                    <CalendarBlank size={24} />
                    <span>Agenda</span>
                  </Link>
                </li>
                <hr />
              </>
            )}
            {hasPermission("pacientes") && (
              <>
                <li className="hover:text-blue-300 cursor-pointer">
                  <Link
                    href="/dashboard/pacientes"
                    className="flex items-center space-x-2 w-full"
                  >
                    <Person size={24} />
                    <span>Pacientes</span>
                  </Link>
                </li>
                <hr />
              </>
            )}
            {hasPermission("sessoes") && (
              <>
                <li className="hover:text-blue-300 cursor-pointer">
                  <Link
                    href="/dashboard/sessoes"
                    className="flex items-center space-x-2 w-full"
                  >
                    <CalendarCheck size={24} />
                    <span>Sessões</span>
                  </Link>
                </li>
                <hr />
              </>
            )}
            {hasPermission("terapeutas") && (
              <>
                <li className="hover:text-blue-300 cursor-pointer">
                  <Link
                    href="/dashboard/terapeutas"
                    className="flex items-center space-x-2 w-full"
                  >
                    <UsersThree size={24} />
                    <span>Terapeutas</span>
                  </Link>
                </li>
                <hr />
              </>
            )}
            {hasPermission("transacoes") && (
              <>
                <li className="hover:text-blue-300 cursor-pointer">
                  <Link
                    href="/dashboard/transacoes"
                    className="flex items-center space-x-2 w-full"
                  >
                    <Money size={24} />
                    <span>Transações</span>
                  </Link>
                </li>
                <hr />
              </>
            )}
            {hasPermission("convites") && (
              <>
                <li className="hover:text-blue-300 cursor-pointer">
                  <Link
                    href="/dashboard/convites"
                    className="flex items-center space-x-2 w-full"
                  >
                    <EnvelopeSimple size={24} />
                    <span>Convites</span>
                  </Link>
                </li>
                <hr />
              </>
            )}
            {hasPermission("usuarios") && (
              <>
                <li className="hover:text-blue-300 cursor-pointer">
                  <Link
                    href="/dashboard/usuarios"
                    className="flex items-center space-x-2 w-full"
                  >
                    <User size={24} />
                    <span>Usuários</span>
                  </Link>
                </li>
                <hr />
              </>
            )}
            {hasPermission("perfil") && (
              <>
                <li className="hover:text-blue-300 cursor-pointer">
                  <Link
                    href="/dashboard/perfil"
                    className="flex items-center space-x-2 w-full"
                  >
                    <Person size={24} />
                    <span>Meu Perfil</span>
                  </Link>
                </li>
                <hr />
              </>
            )}
            <li className="hover:text-blue-300 cursor-pointer mt-6">
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 w-full"
              >
                <SignOut size={24} />
                <span>Sair</span>
              </button>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
};

export default Menu;
