import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Formatador de data
export const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

// Formatador de data com hora
export const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

// Formatador de moeda
export const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

// Função para mascarar data (dd/mm/yyyy)
export const maskDate = (value: string): string => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "$1/$2")
    .replace(/(\d{2})(\d)/, "$1/$2")
    .replace(/(\d{4})\d+?$/, "$1");
};

// Função para mascarar telefone ((99) 99999-9999)
export const maskPhone = (value: string): string => {
  return value
    .replace(/\D/g, "")
    .replace(/^(\d{2})(\d)/g, "($1) $2")
    .replace(/(\d)(\d{4})$/, "$1-$2");
};

// Função para mascarar CPF (999.999.999-99)
export const maskCPF = (value: string): string => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");
};

// Função para mascarar preço (R$ 0,00)
export const maskPrice = (value: string): string => {
  value = value.replace(/\D/g, "");

  if (value === "") {
    return "R$ 0,00";
  }

  const centavos = parseInt(value, 10) / 100;
  return `R$ ${centavos.toFixed(2).replace(".", ",")}`;
};

// Função para formatar data extenso
export const formatDateExtended = (date: Date): string => {
  return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
};

/**
 * Calcula o valor de repasse baseado no valor da sessão e na data de entrada do terapeuta
 * @param valorSessao Valor da sessão
 * @param dataEntrada Data de entrada do terapeuta
 * @returns Valor do repasse calculado
 */
export function calcularRepasse(
  valorSessao: number,
  dataEntrada?: string | Date,
): number {
  if (!valorSessao) return 0;
  if (!dataEntrada) return valorSessao * 0.5; // Padrão 50% se não tiver data de entrada

  const hoje = new Date();
  const dtEntrada = new Date(dataEntrada);

  // Verificar se a data é válida
  if (isNaN(dtEntrada.getTime())) return valorSessao * 0.5;

  // Calcular diferença em anos
  const diffTime = Math.abs(hoje.getTime() - dtEntrada.getTime());
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365);

  // Aplicar lógica de porcentagem baseada no tempo de casa
  if (diffYears < 1) {
    return valorSessao * 0.5; // Menos de 1 ano: 50%
  } else if (diffYears < 2) {
    return valorSessao * 0.55; // Entre 1 e 2 anos: 55%
  } else if (diffYears < 3) {
    return valorSessao * 0.6; // Entre 2 e 3 anos: 60%
  } else if (diffYears < 4) {
    return valorSessao * 0.65; // Entre 3 e 4 anos: 65%
  } else {
    return valorSessao * 0.7; // 4 anos ou mais: 70%
  }
}
