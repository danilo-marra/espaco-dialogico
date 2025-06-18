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
    <div className="bg-white rounded shadow overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Cabeçalho dos dias da semana */}
        <div className="grid grid-cols-7 gap-px bg-rosa">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
            <div
              key={day}
              className="p-4 text-center font-semibold text-white min-w-[114px]"
            >
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
                    min-w-[114px]
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
                <div className="space-y-1 overflow-hidden">
                  {dayAgendamentos.slice(0, 3).map((agendamento) => (
                    <div
                      key={agendamento.id}
                      className={`p-1 text-xs cursor-pointer hover:bg-slate-100 transition-colors duration-200 rounded
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
                      <div className="flex justify-between items-start">
                        <div className="font-semibold truncate flex-1">
                          {agendamento.horarioAgendamento} -{" "}
                          {agendamento.terapeutaInfo?.nome.split(" ")[0]}
                        </div>
                        <button
                          type="button"
                          title="Excluir agendamento"
                          className="text-red-500 ml-1 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(agendamento);
                          }}
                        >
                          <TrashSimple size={12} weight="bold" />
                        </button>
                      </div>
                      <div className="truncate">
                        {agendamento.pacienteInfo?.nome}
                      </div>
                      <hr
                        className={`my-1 border-2 ${
                          agendamento.localAgendamento === "Sala Verde"
                            ? "border-green-500"
                            : "border-blue-500"
                        }`}
                      />
                    </div>
                  ))}
                  {dayAgendamentos.length > 3 && (
                    <div className="text-xs text-gray-500 p-1">
                      +{dayAgendamentos.length - 3} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
