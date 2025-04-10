import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export interface User {
  id: string;
  username: string;
  email: string;
}

export default function useAuth(redirectTo = "/login") {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Verificar se está no cliente
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("authToken");
      const storedUser = localStorage.getItem("user");

      if (!token || !storedUser) {
        // Não autenticado, redirecionar
        router.push(redirectTo);
        return;
      }

      try {
        // Armazenar dados do usuário no estado
        setUser(JSON.parse(storedUser));
      } catch (e) {
        // Em caso de erro ao analisar o JSON, redirecionar
        router.push(redirectTo);
        return;
      }
    }

    setIsLoading(false);
  }, [redirectTo, router]);

  return { user, isLoading };
}
