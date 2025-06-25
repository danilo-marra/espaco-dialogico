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

  // Prioriza o nome do usuário, se disponível
  const displayName = user?.name || user?.username || "Usuário";

  // Função para obter saudação baseada no horário do Brasil (GMT-3)
  const getGreeting = () => {
    const now = new Date();
    // Converte para o fuso horário do Brasil (GMT-3)
    const brasilTime = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const hour = brasilTime.getUTCHours();

    if (hour >= 5 && hour < 12) {
      return "Bom dia";
    } else if (hour >= 12 && hour < 18) {
      return "Boa tarde";
    } else {
      return "Boa noite";
    }
  };

  return (
    <header
      data-testid="header-component"
      className="flex items-center justify-between bg-gray-100 py-4 px-4 md:px-8 sticky top-0 z-10 shadow-sm"
    >
      <div>
        <p className="text-xl hidden md:block">
          {getGreeting()},
          <span className="font-bold text-2xl"> {displayName}</span>
        </p>
      </div>
      <div className="profile flex items-center space-x-2 md:space-x-4">
        <div className="flex flex-col items-end">
          <span className="font-semibold text-sm md:text-base">
            {displayName}
          </span>
          <span className="text-xs md:text-sm text-gray-500 hidden sm:block">
            {user?.email || "email@exemplo.com"}
          </span>
        </div>
        <div className="flex items-center ml-1">
          <SignOut size={22} className="cursor-pointer mr-1" />
          <button
            onClick={handleLogout}
            className="text-blue-600 hover:underline text-sm md:text-base"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
