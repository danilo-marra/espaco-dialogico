import { SignOut, User } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";

const Header = () => {
  return (
    <header className="flex items-center justify-between bg-gray-100 py-4 px-8">
      <div>
        <p className="text-xl hidden md:block">
          Bem vindo,
          <span className="font-bold text-2xl"> Danilo Marra Rabelo</span>
        </p>
      </div>
      <div className="profile flex items-center space-x-4">
        <div>
          <span>Danilo Marra Rabelo</span>
          <div className="flex items-center">
            <User size={22} />
            <a className="px-2" href="">
              Perfil
            </a>
            <SignOut size={22} />
            <Link href="/">Sair</Link>
          </div>
        </div>
        <Image
          className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center"
          src="https://github.com/danilo-marra.png"
          alt="Profile picture"
          width={40}
          height={40}
          priority
        />
      </div>
    </header>
  );
};

export default Header;
