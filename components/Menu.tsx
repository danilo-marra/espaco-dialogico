import {
  CalendarBlank,
  CalendarCheck,
  House,
  List,
  Money,
  Person,
  UsersThree,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";

const Menu = () => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  return (
    <div>
      <button
        type="button"
        className={`fixed top-5 left-5 md:hidden focus:outline-none z-30 ${
          isMenuOpen ? "text-white" : "text-gray-500"
        }`}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        <List size={24} weight="bold" />
      </button>
      <aside
        data-testid="menu-component"
        className={`fixed md:static h-full w-64 bg-azul text-white p-6 transform ${isMenuOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 transition-transform duration-300 ease-in-out z-20`}
      >
        <Image
          src="/img/logo2.png"
          alt="Logo Espaço Dialógico"
          width={250}
          height={250}
          priority
        />
        <span className="block mb-8 text-2xl font-bold">Espaço Dialógico</span>
        <ul className="menu space-y-4">
          <li className="hover:text-blue-300 cursor-pointer flex items-center space-x-2">
            <House weight="fill" size={24} />
            <Link href="/dashboard/home">Home</Link>
          </li>
          <hr />
          <li className="hover:text-blue-300 cursor-pointer flex items-center space-x-2">
            <CalendarBlank size={24} />
            <Link href="/dashboard/agenda">Agenda</Link>
          </li>
          <hr />
          <li className="hover:text-blue-300 cursor-pointer flex items-center space-x-2">
            <Money size={24} />
            <Link href="/dashboard/transacoes">Transações</Link>
          </li>
          <hr />
          <li className="hover:text-blue-300 cursor-pointer flex items-center space-x-2">
            <Person size={24} />
            <Link href="/dashboard/pacientes">Pacientes</Link>
          </li>
          <hr />
          <li className="hover:text-blue-300 cursor-pointer flex items-center space-x-2">
            <CalendarCheck size={24} />
            <Link href="/dashboard/sessoes">Sessões</Link>
          </li>
          <hr />
          <li className="hover:text-blue-300 cursor-pointer flex items-center space-x-2">
            <UsersThree size={24} />
            <Link href="/dashboard/terapeutas">Terapeutas</Link>
          </li>
          <hr />
        </ul>
      </aside>
    </div>
  );
};

export default Menu;
