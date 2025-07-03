/**
 * Função utilitária para obter cores padronizadas dos status das notas fiscais
 * @param status - Status da nota fiscal
 * @returns String com as classes CSS para cor do badge
 */
export const getNotaFiscalStatusColor = (status: string): string => {
  switch (status) {
    case "Não Emitida":
      return "bg-red-100 text-red-800";
    case "Emitida":
      return "bg-yellow-100 text-yellow-800";
    case "Enviada":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

/**
 * Função utilitária para obter cores padronizadas dos status de pagamento
 * @param status - Status do pagamento
 * @returns String com as classes CSS para cor do badge
 */
export const getPagamentoStatusColor = (status: boolean): string => {
  return status
    ? "bg-green-100 text-green-800"
    : "bg-yellow-100 text-yellow-800";
};

/**
 * Função utilitária para obter cores padronizadas dos status de repasse
 * @param status - Status do repasse
 * @returns String com as classes CSS para cor do badge
 */
export const getRepasseStatusColor = (status: boolean): string => {
  return status ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-800";
};

/**
 * Função utilitária para obter cores padronizadas dos tipos de sessão
 * @param tipo - Tipo da sessão
 * @returns String com as classes CSS para cor do badge
 */
export const getTipoSessaoColor = (tipo: string): string => {
  switch (tipo) {
    case "Anamnese":
      return "bg-blue-100 text-blue-800";
    case "Atendimento":
      return "bg-green-100 text-green-800";
    case "Avaliação":
      return "bg-amber-100 text-amber-800";
    case "Visita Escolar":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};
