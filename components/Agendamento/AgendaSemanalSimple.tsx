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
      {/* Container com scroll horizontal forçado */}
      <div
        style={{
          overflowX: "scroll",
          overflowY: "hidden",
          width: "100%",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* Conteúdo com largura fixa maior que o container */}
        <div style={{ width: "800px", minWidth: "800px" }}>
          {/* Cabeçalho dos dias da semana */}
          <div style={{ display: "flex", backgroundColor: "#EC4899" }}>
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
              <div
                key={day}
                style={{
                  width: "114px",
                  minWidth: "114px",
                  padding: "16px",
                  textAlign: "center",
                  fontWeight: "600",
                  color: "white",
                  flexShrink: 0,
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Dias da semana */}
          <div
            style={{ display: "flex", backgroundColor: "#E5E7EB", gap: "1px" }}
          >
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
                  style={{
                    width: "114px",
                    minWidth: "114px",
                    minHeight: "120px",
                    padding: "8px",
                    backgroundColor: "white",
                    cursor: "pointer",
                    position: "relative",
                    flexShrink: 0,
                    border: isDragOver ? "2px solid #6366f1" : "none",
                  }}
                  onClick={() => onDayClick(day)}
                  onDragOver={(e) => handleDragOver(e, day)}
                  onDrop={(e) => handleDrop(e, day)}
                >
                  <div
                    style={{
                      fontWeight: "600",
                      marginBottom: "4px",
                      color: isCurrentDay ? "#2563eb" : "#000",
                    }}
                  >
                    {format(day, "dd/MM")}
                    {isCurrentDay && (
                      <span
                        style={{
                          marginLeft: "4px",
                          fontSize: "12px",
                          backgroundColor: "#3b82f6",
                          color: "white",
                          padding: "2px 4px",
                          borderRadius: "4px",
                        }}
                      >
                        Hoje
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    {dayAgendamentos.map((agendamento) => (
                      <div
                        key={agendamento.id}
                        style={{
                          fontSize: "14px",
                          padding: "4px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          backgroundColor:
                            agendamento.statusAgendamento === "Cancelado"
                              ? "#fecaca"
                              : "#f8fafc",
                          textDecoration:
                            agendamento.statusAgendamento === "Cancelado"
                              ? "line-through"
                              : "none",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditAgendamento(agendamento);
                        }}
                        draggable={true}
                        onDragStart={() => handleDragStart(agendamento)}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <div style={{ fontWeight: "600", fontSize: "12px" }}>
                            {agendamento.horarioAgendamento} -{" "}
                            {agendamento.terapeutaInfo?.nome}
                          </div>
                          <button
                            type="button"
                            title="Excluir agendamento"
                            style={{
                              color: "#ef4444",
                              border: "none",
                              background: "none",
                              cursor: "pointer",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(agendamento);
                            }}
                          >
                            <TrashSimple size={16} weight="bold" />
                          </button>
                        </div>
                        <div style={{ fontSize: "12px", marginTop: "2px" }}>
                          {agendamento.pacienteInfo?.nome}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            fontStyle: "italic",
                            color: "#64748b",
                            marginTop: "2px",
                          }}
                        >
                          {agendamento.tipoAgendamento} -{" "}
                          {agendamento.modalidadeAgendamento}
                        </div>
                        <hr
                          style={{
                            margin: "4px 0",
                            border: "none",
                            borderTop: `2px solid ${
                              agendamento.localAgendamento === "Sala Verde"
                                ? "#10b981"
                                : "#3b82f6"
                            }`,
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
