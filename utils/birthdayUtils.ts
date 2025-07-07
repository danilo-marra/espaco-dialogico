import { parseAnyDate } from "./dateUtils";

/**
 * Verifica se uma data específica é aniversário de uma pessoa
 * @param birthDate - Data de nascimento da pessoa
 * @param targetDate - Data a ser verificada
 * @returns true se for aniversário, false caso contrário
 */
export function isBirthday(
  birthDate: Date | string | null | undefined,
  targetDate: Date | string,
): boolean {
  if (!birthDate) return false;

  try {
    const birth = parseAnyDate(birthDate);
    const target = parseAnyDate(targetDate);

    // Comparar dia e mês
    return (
      birth.getDate() === target.getDate() &&
      birth.getMonth() === target.getMonth()
    );
  } catch {
    return false;
  }
}

/**
 * Calcula a idade de uma pessoa em uma data específica
 * @param birthDate - Data de nascimento da pessoa
 * @param targetDate - Data de referência (padrão: hoje)
 * @returns idade em anos
 */
export function calculateAge(
  birthDate: Date | string | null | undefined,
  targetDate: Date | string = new Date(),
): number {
  if (!birthDate) return 0;

  try {
    const birth = parseAnyDate(birthDate);
    const target = parseAnyDate(targetDate);

    let age = target.getFullYear() - birth.getFullYear();
    const monthDiff = target.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && target.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age;
  } catch {
    return 0;
  }
}
