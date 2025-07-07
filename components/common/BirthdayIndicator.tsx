import { Cake } from "@phosphor-icons/react";
import { calculateAge } from "utils/birthdayUtils";

interface BirthdayIndicatorProps {
  birthDate: Date | string | null | undefined;
  targetDate: Date | string;
  className?: string;
  size?: number;
}

export function BirthdayIndicator({
  birthDate,
  targetDate,
  className = "",
  size = 16,
}: BirthdayIndicatorProps) {
  if (!birthDate) return null;

  const age = calculateAge(birthDate, targetDate);

  return (
    <div
      className={`inline-flex items-center ${className}`}
      title={`Aniversário - ${age} anos`}
    >
      <Cake size={size} weight="fill" className="text-pink-500" />
    </div>
  );
}
