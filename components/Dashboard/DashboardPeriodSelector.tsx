import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@phosphor-icons/react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
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
  const selectedDate = parseAPIDate(`${selectedPeriod}-01`);

  const handlePeriodChange = (direction: "prev" | "next") => {
    const [ano, mes] = selectedPeriod.split("-").map(Number);
    const data = new Date(ano, mes - 1, 1);
    data.setMonth(data.getMonth() + (direction === "prev" ? -1 : 1));

    const novoPeriodo = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
    onChangePeriod(novoPeriodo);
  };

  const handleCalendarChange = (date: Date | null) => {
    if (!date) return;

    const novoPeriodo = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    onChangePeriod(novoPeriodo);
  };

  return (
    <div className="inline-flex items-center gap-3 px-1 py-1">
      <button
        onClick={() => handlePeriodChange("prev")}
        className="h-10 w-10 rounded-lg border bg-gray-50 text-lg font-semibold text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled}
        aria-label="Mês anterior"
      >
        ←
      </button>
      <div className="flex items-center">
        <span className="min-w-[180px] text-center text-2xl font-bold capitalize tracking-wide text-azul">
          {format(selectedDate, "MMMM yyyy", {
            locale: ptBR,
          })}
        </span>
        <DatePicker
          selected={selectedDate}
          onChange={handleCalendarChange}
          dateFormat="MM/yyyy"
          locale={ptBR}
          showMonthYearPicker
          disabled={disabled}
          wrapperClassName="inline-flex items-center"
          customInput={
            <button
              type="button"
              className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded leading-none text-azul transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Selecionar mês e ano"
            >
              <Calendar size={26} />
            </button>
          }
        />
      </div>
      <button
        onClick={() => handlePeriodChange("next")}
        className="h-10 w-10 rounded-lg border bg-gray-50 text-lg font-semibold text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled}
        aria-label="Próximo mês"
      >
        →
      </button>
    </div>
  );
}
