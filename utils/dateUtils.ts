/**
 * Utilitários para manipulação segura de datas, evitando problemas de timezone
 */

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Formata uma data para o formato YYYY-MM-DD de forma segura,
 * evitando problemas de timezone entre ambientes
 */
export function formatDateForAPI(date: Date): string {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error("Data inválida fornecida para formatDateForAPI");
  }

  // Usar métodos locais da data para evitar conversões de timezone
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Formata data de forma segura para exibição
 */
export function formatSafeDate(dateValue: any): string {
  if (!dateValue) return "-";

  try {
    // Usa a função parseAnyDate para garantir que a data seja tratada corretamente
    const date = parseAnyDate(dateValue);
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  } catch (error) {
    console.error("Erro ao formatar data segura:", error);
    return "Data inválida";
  }
}

/**
 * Converte uma string de data no formato YYYY-MM-DD ou ISO para um objeto Date
 * de forma segura, evitando problemas de timezone
 */
export function parseAPIDate(dateString: string): Date {
  if (!dateString || typeof dateString !== "string") {
    throw new Error("String de data inválida fornecida para parseAPIDate");
  }

  // Se a string contém 'T' (formato ISO), extrair apenas a parte da data
  let dateOnly = dateString;
  if (dateString.includes("T")) {
    dateOnly = dateString.split("T")[0];
  }

  // Dividir a string de data manualmente para evitar problemas de timezone
  const [year, month, day] = dateOnly.split("-").map(Number);

  if (
    !year ||
    !month ||
    !day ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    throw new Error(`Formato de data inválido: ${dateString}`);
  }

  // Criar data no timezone local (não UTC)
  return new Date(year, month - 1, day);
}

/**
 * Verifica se uma data é válida
 */
export function isValidDate(date: any): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Formata uma data para exibição no formato dd/MM/yyyy
 */
export function formatDateForDisplay(date: Date): string {
  if (!isValidDate(date)) {
    return "";
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Converte uma data do formato dd/MM/yyyy para Date
 */
export function parseDisplayDate(dateString: string): Date {
  if (!dateString || typeof dateString !== "string") {
    throw new Error("String de data inválida fornecida para parseDisplayDate");
  }

  const [day, month, year] = dateString.split("/").map(Number);

  if (
    !year ||
    !month ||
    !day ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    throw new Error(`Formato de data inválido: ${dateString}`);
  }

  return new Date(year, month - 1, day);
}

/**
 * Converte qualquer formato de data (string ou Date) para um objeto Date
 * de forma segura, tratando diferentes formatos que podem vir da API
 */
export function parseAnyDate(dateInput: string | Date): Date {
  if (!dateInput) {
    throw new Error("Data inválida fornecida para parseAnyDate");
  }

  // Se já é um objeto Date válido, retornar como está
  if (dateInput instanceof Date) {
    if (isValidDate(dateInput)) {
      return dateInput;
    } else {
      throw new Error("Objeto Date inválido fornecido");
    }
  }

  // Se é string, tentar diferentes formatos
  if (typeof dateInput === "string") {
    // Formato ISO completo (2025-06-19T03:00:00.000Z)
    if (dateInput.includes("T")) {
      return parseAPIDate(dateInput); // Nossa função já lida com isso agora
    }

    // Formato YYYY-MM-DD
    if (dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return parseAPIDate(dateInput);
    }

    // Formato dd/MM/yyyy
    if (dateInput.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      return parseDisplayDate(dateInput);
    }

    // Tentar como timestamp ou outros formatos
    const parsedDate = new Date(dateInput);
    if (isValidDate(parsedDate)) {
      // Converter para data local sem hora
      return new Date(
        parsedDate.getFullYear(),
        parsedDate.getMonth(),
        parsedDate.getDate(),
      );
    }
  }

  throw new Error(`Formato de data não suportado: ${dateInput}`);
}

/**
 * Formata uma data para o formato SQL DATE (YYYY-MM-DD) de forma ultra-segura
 * Especificamente para uso com bancos de dados
 */
export function formatDateForSQL(dateInput: string | Date): string {
  let date: Date;

  // Converter para Date se necessário
  if (typeof dateInput === "string") {
    date = parseAnyDate(dateInput);
  } else if (dateInput instanceof Date && isValidDate(dateInput)) {
    date = dateInput;
  } else {
    throw new Error("Data inválida fornecida para formatDateForSQL");
  }

  // Usar getFullYear, getMonth, getDate para garantir timezone local
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  const formatted = `${year}-${month}-${day}`;

  // Validar o formato final
  if (!formatted.match(/^\d{4}-\d{2}-\d{2}$/)) {
    throw new Error(`Formato de data SQL inválido gerado: ${formatted}`);
  }

  return formatted;
}

/**
 * Obter a data da sessão a partir dos dados do agendamento
 * A data da sessão vem sempre do agendamento relacionado
 */
export function getSessaoDate(sessao: any): Date | null {
  if (!sessao?.agendamentoInfo?.dataAgendamento) {
    return null;
  }

  try {
    // Usa a função parseAnyDate para garantir que a data seja tratada corretamente
    return parseAnyDate(sessao.agendamentoInfo.dataAgendamento);
  } catch (error) {
    console.warn("Erro ao processar data da sessão:", error);
    return null;
  }
}

/**
 * Formatar a data da sessão para exibição
 */
export function formatSessaoDate(sessao: any): string {
  const date = getSessaoDate(sessao);
  if (!date) {
    return "Data não informada";
  }

  return formatSafeDate(date);
}

/**
 * Filtrar sessões por status de pagamento
 * Nota: Função removida - agora todas as sessões aparecem nas transações
 * Mantida para compatibilidade mas retorna todas as sessões
 */
export function filterSessoesPagas(sessoes: any[]): any[] {
  if (!Array.isArray(sessoes)) {
    return [];
  }

  // Retorna todas as sessões - filtro de status removido
  return sessoes;
}

/**
 * Verificar se uma sessão deve aparecer nas transações financeiras
 * Nota: Função removida - agora todas as sessões aparecem nas transações
 */
export function sessaoDeveAparecerNasTransacoes(_sessao: any): boolean {
  // Retorna sempre true - todas as sessões devem aparecer
  return true;
}
