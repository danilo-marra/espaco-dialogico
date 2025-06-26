import { useState, useEffect } from "react";
import useAuth from "./useAuth";

interface TerapeutaProfile {
  id: string;
  isNew: boolean;
  nome: string;
  email: string;
  telefone?: string;
  especialidade?: string;
  descricao?: string;
}

interface UseFirstAccessTerapeuta {
  isFirstAccess: boolean;
  terapeutaProfile: TerapeutaProfile | null;
  loading: boolean;
  error: string | null;
  dismissFirstAccess: () => void;
}

export function useFirstAccessTerapeuta(): UseFirstAccessTerapeuta {
  const { user, isAuthenticated } = useAuth();
  const [isFirstAccess, setIsFirstAccess] = useState(false);
  const [terapeutaProfile, setTerapeutaProfile] =
    useState<TerapeutaProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkFirstAccess = async () => {
      // Só verifica se for um terapeuta autenticado
      if (!isAuthenticated || user?.role !== "terapeuta") {
        return;
      }

      // Verificar se já foi dismissado nesta sessão
      const dismissedKey = `firstAccess_dismissed_${user.id}`;
      const alreadyDismissed = sessionStorage.getItem(dismissedKey);

      if (alreadyDismissed) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          throw new Error("Token não encontrado");
        }

        const response = await fetch(`/api/v1/terapeutas/by-user/${user.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Erro ao buscar dados do terapeuta");
        }

        const data = await response.json();
        setTerapeutaProfile(data);

        // Se isNew for true, significa que é o primeiro acesso
        if (data.isNew) {
          setIsFirstAccess(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    };

    checkFirstAccess();
  }, [user, isAuthenticated]);

  const dismissFirstAccess = () => {
    if (user) {
      const dismissedKey = `firstAccess_dismissed_${user.id}`;
      sessionStorage.setItem(dismissedKey, "true");
    }
    setIsFirstAccess(false);
  };

  return {
    isFirstAccess,
    terapeutaProfile,
    loading,
    error,
    dismissFirstAccess,
  };
}
