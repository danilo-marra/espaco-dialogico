import React from "react";
import { User, Shield, UserCircle } from "@phosphor-icons/react";

interface RoleBasedInfoProps {
  userRole: string;
  className?: string;
}

export function RoleBasedInfo({
  userRole,
  className = "",
}: RoleBasedInfoProps) {
  const getRoleInfo = () => {
    switch (userRole) {
      case "admin":
        return {
          icon: <Shield size={20} className="text-purple-600" />,
          title: "Administrador",
          description:
            "Acesso completo ao sistema - pode gerenciar todos os agendamentos, pacientes e usuários",
          bgColor: "bg-purple-50",
          borderColor: "border-purple-200",
        };
      case "secretaria":
        return {
          icon: <UserCircle size={20} className="text-green-600" />,
          title: "Secretaria",
          description:
            "Pode gerenciar agendamentos, pacientes e terapeutas - acesso administrativo limitado",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
        };
      case "terapeuta":
        return {
          icon: <User size={20} className="text-blue-600" />,
          title: "Terapeuta",
          description:
            "Pode visualizar todos os agendamentos, mas só pode criar/editar agendamentos dos seus próprios pacientes",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
        };
      default:
        return {
          icon: <User size={20} className="text-gray-600" />,
          title: "Usuário",
          description: "Acesso básico ao sistema",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
        };
    }
  };

  const roleInfo = getRoleInfo();

  return (
    <div
      className={`${roleInfo.bgColor} ${roleInfo.borderColor} border rounded-lg p-3 ${className}`}
    >
      <div className="flex items-start gap-3">
        {roleInfo.icon}
        <div className="flex-1">
          <h4 className="font-medium text-sm text-gray-900">
            {roleInfo.title}
          </h4>
          <p className="text-xs text-gray-600 mt-1">{roleInfo.description}</p>
        </div>
      </div>
    </div>
  );
}
