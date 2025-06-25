import React from "react";
import { Lock, PencilSimple } from "@phosphor-icons/react";
import { Agendamento } from "tipos";
import useAuth from "hooks/useAuth";
import { useFetchTerapeutas } from "hooks/useFetchTerapeutas";

interface AgendamentoPermissionIndicatorProps {
  agendamento: Agendamento;
  className?: string;
}

export function AgendamentoPermissionIndicator({
  agendamento,
  className = "",
}: AgendamentoPermissionIndicatorProps) {
  const { user } = useAuth();
  const { terapeutas } = useFetchTerapeutas();

  const userRole = user?.role || "terapeuta";

  // Se não for terapeuta, não mostrar indicador (admin e secretaria podem editar tudo)
  if (userRole !== "terapeuta") {
    return null;
  }

  // Verificar se o terapeuta logado pode editar este agendamento
  const currentUserTerapeuta = terapeutas?.find(
    (t) => t.user_id === user?.id?.toString(),
  );

  const canEdit = currentUserTerapeuta?.id === agendamento.terapeuta_id;

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      {canEdit ? (
        <div title="Você pode editar este agendamento">
          <PencilSimple size={12} className="text-green-600" />
        </div>
      ) : (
        <div title="Agendamento de outro terapeuta (somente visualização)">
          <Lock size={12} className="text-gray-400" />
        </div>
      )}
    </div>
  );
}
