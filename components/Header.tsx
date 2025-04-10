import { SignOut } from "@phosphor-icons/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { User as UserType } from "../hooks/useAuth";

const Header = () => {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Este useEffect garante que o código só seja executado no cliente
  useEffect(() => {
    setIsClient(true);
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Erro ao carregar dados do usuário:", e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    toast.success("Logout realizado com sucesso");
    router.push("/login");
  };

  // Renderização condicional para garantir que não haja problemas de hidratação
  if (!isClient) {
    return null;
  }

  return (
    <header
      data-testid="header-component"
      className="flex items-center justify-between bg-gray-100 py-4 px-8"
    >
      <div>
        <p className="text-xl hidden md:block">
          Bem vindo,
          <span className="font-bold text-2xl">
            {" "}
            {user?.username || "Usuário"}
          </span>
        </p>
      </div>
      <div className="profile flex items-center space-x-4">
        <div className="flex flex-col items-end">
          <span className="font-semibold">{user?.username || "Usuário"}</span>
          <span className="text-sm text-gray-500">
            {user?.email || "email@exemplo.com"}
          </span>
        </div>
        <div className="flex items-center">
          <SignOut size={22} className="cursor-pointer mr-1" />
          <button
            onClick={handleLogout}
            className="text-blue-600 hover:underline"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
