import React from "react";
import { format, isSameDay, isToday } from "date-fns";
import { TrashSimple } from "@phosphor-icons/react";
import { Agendamento } from "tipos";

interface AgendaSemanalProps {
  daysOfWeek: Date[];
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

export const AgendaSemanal: React.FC<AgendaSemanalProps> = ({
  daysOfWeek,
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
      {/* Dias da semana */}
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {daysOfWeek.map((day) => {
          const dayAgendamentos = agendamentos
            .filter((agendamento) =>
              isSameDay(new Date(agendamento.dataAgendamento), day),
            )
            .sort(sortByTime);
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
                bg-white 
                hover:shadow-inner 
                hover:bg-gray-50
                hover:translate-y-[1px]
                relative
                ${isDragOver ? "ring-2 ring-indigo-500 ring-opacity-70 shadow-lg" : "shadow-sm"}
              `}
              onClick={() => onDayClick(day)}
              onDragOver={(e) => handleDragOver(e, day)}
              onDrop={(e) => handleDrop(e, day)}
            >
              <div
                className={`font-semibold mb-1 ${isCurrentDay ? "text-blue-600" : ""}`}
              >
                {format(day, "dd/MM")}
                {isCurrentDay && (
                  <span className="ml-1 text-xs bg-blue-500 text-white px-1 rounded">
                    Hoje
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {dayAgendamentos.map((agendamento) => (
                  <div
                    key={agendamento.id}
                    className={`text-sm p-1 space-y-1 rounded cursor-pointer transition-colors duration-200 hover:bg-slate-50 group 
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
                      <div className="group-hover:text-zinc-500 font-semibold">
                        {agendamento.horarioAgendamento} -{" "}
                        {agendamento.terapeutaInfo?.nome}
                      </div>
                      <div>
                        <button
                          type="button"
                          title="Excluir agendamento"
                          className="text-red-400 hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(agendamento);
                          }}
                        >
                          <TrashSimple size={20} weight="bold" />
                        </button>
                      </div>
                    </div>
                    <div className="group-hover:text-zinc-500">
                      {agendamento.pacienteInfo?.nome}
                    </div>
                    <div className="italic text-slate-500 group-hover:text-zinc-500">
                      {agendamento.tipoAgendamento} -{" "}
                      {agendamento.modalidadeAgendamento}
                    </div>
                    <hr
                      className={`border-2 ${
                        agendamento.localAgendamento === "Sala Verde"
                          ? "border-green-500"
                          : "border-blue-500"
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
