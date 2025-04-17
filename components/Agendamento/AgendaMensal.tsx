import React from "react";
import { format, isSameDay, isSameMonth, isToday } from "date-fns";
import { TrashSimple } from "@phosphor-icons/react";
import { Agendamento } from "tipos";

interface AgendaMensalProps {
  daysOfMonth: Date[];
  selectedDate: Date;
  agendamentos: Agendamento[];
  sortByTime: (_a: Agendamento, _b: Agendamento) => number;
  handleEditAgendamento: (_agendamento: Agendamento) => void;
  handleDeleteClick: (_agendamento: Agendamento) => void;
  handleDragStart: (_agendamento: Agendamento) => void;
  handleDragOver: (_e: React.DragEvent, _date: Date) => void;
  handleDrop: (_e: React.DragEvent, _date: Date) => void;
  dragOverDate: Date | null;
  onDayClick: (_date: Date) => void;
}

export const AgendaMensal: React.FC<AgendaMensalProps> = ({
  daysOfMonth,
  selectedDate,
  agendamentos,
  sortByTime,
  handleEditAgendamento,
  handleDeleteClick,
  handleDragStart,
  handleDragOver,
  handleDrop,
  dragOverDate,
  onDayClick,
}) => {
  return (
    <div className="bg-white rounded shadow">
      {/* Cabeçalho dos dias da semana */}
      <div className="grid grid-cols-7 gap-px bg-rosa">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
          <div key={day} className="p-4 text-center font-semibold text-white">
            {day}
          </div>
        ))}
      </div>
      {/* Grade mensal */}
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {daysOfMonth.map((day) => {
          const dayAgendamentos = agendamentos
            .filter((agendamento) =>
              isSameDay(new Date(agendamento.dataAgendamento), day),
            )
            .sort(sortByTime);
          const isCurrentMonth = isSameMonth(day, selectedDate);
          const isCurrentDay = isToday(day);
          const isDragOver = dragOverDate && isSameDay(dragOverDate, day);

          return (
            <div
              key={day.toISOString()}
              className={`
                  cursor-pointer 
                  min-h-[120px] 
                  p-2 
                  transition-all 
                  duration-200 
                  hover:shadow-inner 
                  hover:bg-gray-50
                  hover:translate-y-[1px]
                  relative
                ${!isCurrentMonth ? "bg-gray-100" : "bg-white"}
                ${isDragOver ? "ring-2 ring-indigo-500 ring-opacity-70 shadow-lg" : ""}`}
              onClick={() => onDayClick(day)}
              onDragOver={(e) => handleDragOver(e, day)}
              onDrop={(e) => handleDrop(e, day)}
            >
              <div
                className={`text-sm font-semibold ${isCurrentDay ? "text-blue-600" : ""}`}
              >
                {format(day, "d")}
                {isCurrentDay && (
                  <span className="ml-1 text-xs bg-blue-500 text-white px-1 rounded">
                    Hoje
                  </span>
                )}
              </div>
              {dayAgendamentos.map((agendamento) => (
                <div
                  key={agendamento.id}
                  className={`mt-1 p-1 text-xs cursor-pointer hover:bg-slate-100 transition-colors duration-200 
                  ${
                    agendamento.statusAgendamento === "Cancelado"
                      ? "bg-red-100 line-through"
                      : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditAgendamento(agendamento);
                  }}
                  draggable={true}
                  onDragStart={() => handleDragStart(agendamento)}
                >
                  <div className="flex justify-between">
                    <div className="font-semibold">
                      {agendamento.horarioAgendamento} -{" "}
                      {agendamento.terapeutaInfo?.nome.split(" ")[0]}
                    </div>
                    <div>
                      <button
                        type="button"
                        title="Excluir agendamento"
                        className="text-red-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(agendamento);
                        }}
                      >
                        <TrashSimple size={16} weight="bold" />
                      </button>
                    </div>
                  </div>
                  <div>{agendamento.pacienteInfo?.nome}</div>
                  <hr
                    className={`my-1 border-2 ${
                      agendamento.localAgendamento === "Sala Verde"
                        ? "border-green-500"
                        : "border-blue-500"
                    }`}
                  />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
