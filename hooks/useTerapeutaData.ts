import useSWR from "swr";
import useAuth from "./useAuth";

const fetcher = async (url: string) => {
  const token = localStorage.getItem("authToken");

  if (!token) {
    throw new Error("Token não encontrado");
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Erro ao buscar dados");
  }

  return response.json();
};

export function useTerapeutaData() {
  const { user, isAuthenticated } = useAuth();

  // Verificar se é terapeuta baseado no role
  const isTerapeuta = user?.role === "terapeuta";

  // Só buscar dados se for um terapeuta autenticado
  const shouldFetch = isAuthenticated && isTerapeuta;

  const {
    data: terapeutaData,
    error: terapeutaError,
    mutate: mutateTerapeuta,
  } = useSWR(shouldFetch ? "/api/v1/terapeutas" : null, fetcher);

  const {
    data: pacientesData,
    error: pacientesError,
    mutate: mutatePacientes,
  } = useSWR(shouldFetch ? "/api/v1/pacientes" : null, fetcher);

  // Encontrar o terapeuta atual baseado no usuário logado
  const currentTerapeuta = terapeutaData?.find(
    (t) => t.user_id === user?.id?.toString(),
  );

  // Função para verificar se pode editar um agendamento
  const canEditAgendamento = (agendamento: any) => {
    if (!isTerapeuta || !currentTerapeuta) return false;
    return agendamento.terapeuta_id === currentTerapeuta.id;
  };

  return {
    terapeuta: currentTerapeuta,
    pacientes: pacientesData || [],
    isLoading: shouldFetch && (!terapeutaData || !pacientesData),
    isError: terapeutaError || pacientesError,
    canEditAgendamento,
    mutate: {
      terapeuta: mutateTerapeuta,
      pacientes: mutatePacientes,
    },
  };
}
