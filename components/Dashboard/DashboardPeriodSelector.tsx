import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseAPIDate } from "../../utils/dateUtils";

interface DashboardPeriodSelectorProps {
  selectedPeriod: string;
  onChangePeriod: (_period: string) => void;
  disabled?: boolean;
}

export function DashboardPeriodSelector({
  selectedPeriod,
  onChangePeriod,
  disabled = false,
}: DashboardPeriodSelectorProps) {
  const handlePeriodChange = (direction: "prev" | "next") => {
    const [ano, mes] = selectedPeriod.split("-").map(Number);
    const data = new Date(ano, mes - 1, 1);
    data.setMonth(data.getMonth() + (direction === "prev" ? -1 : 1));

    const novoPeriodo = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
    onChangePeriod(novoPeriodo);
  };

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg border bg-white shadow-sm">
      <span className="text-sm font-semibold text-gray-700 px-2">
        Mês das pendências:
      </span>
      <button
        onClick={() => handlePeriodChange("prev")}
        className="px-3 py-2 rounded-md border bg-gray-50 hover:bg-gray-100 text-sm font-medium"
        disabled={disabled}
        aria-label="Mês anterior"
      >
        ←
      </button>
      <span className="text-sm font-semibold min-w-[140px] text-center capitalize">
        {format(parseAPIDate(`${selectedPeriod}-01`), "MMMM yyyy", {
          locale: ptBR,
        })}
      </span>
      <button
        onClick={() => handlePeriodChange("next")}
        className="px-3 py-2 rounded-md border bg-gray-50 hover:bg-gray-100 text-sm font-medium"
        disabled={disabled}
        aria-label="Próximo mês"
      >
        →
      </button>
    </div>
  );
}
