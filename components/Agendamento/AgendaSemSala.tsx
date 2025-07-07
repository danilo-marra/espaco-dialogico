import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrashSimple } from "@phosphor-icons/react";
import React from "react";
import { Agendamento } from "tipos";
import { parseAnyDate, formatDateForDisplay } from "utils/dateUtils";
import { BirthdayIndicator } from "components/common/BirthdayIndicator";
import { isBirthday } from "utils/birthdayUtils";

interface AgendaSemSalaProps {
  agendamentos: Agendamento[];
  sortByTime: (_a: Agendamento, _b: Agendamento) => number;
  handleEditAgendamento: (_agendamento: Agendamento) => void;
  handleDeleteClick: (_agendamento: Agendamento) => void;
  handleDragStart: (_agendamento: Agendamento) => void;
}

export const AgendaSemSala: React.FC<AgendaSemSalaProps> = ({
  agendamentos,
  sortByTime,
  handleEditAgendamento,
  handleDeleteClick,
  handleDragStart,
}) => {
  return (
    <>
      <div className="bg-white text-center mt-6">
        <h3 className="text-lg font-semibold p-2">
          Agendamentos que não precisam de sala
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
        {agendamentos.sort(sortByTime).map((agendamento) => (
          <div
            key={agendamento.id}
            className={`mt-4 p-4 rounded-lg cursor-pointer transition-colors duration-200 group shadow-md
            ${
              agendamento.statusAgendamento === "Cancelado"
                ? "bg-red-100 line-through hover:bg-red-200"
                : agendamento.sessaoRealizada || agendamento.falta
                  ? "bg-green-100 hover:bg-green-200"
                  : "bg-yellow-100 hover:bg-yellow-200"
            }`}
            onClick={() => handleEditAgendamento(agendamento)}
            draggable={true}
            onDragStart={() => handleDragStart(agendamento)}
          >
            <div className="mb-2">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-slate-500 group-hover:text-zinc-500 text-sm">
                  {formatDateForDisplay(
                    parseAnyDate(agendamento.dataAgendamento),
                  )}{" "}
                  (
                  {format(parseAnyDate(agendamento.dataAgendamento), "EEEE", {
                    locale: ptBR,
                  }).replace(/^\w/, (c) => c.toUpperCase())}
                  )
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
                    <TrashSimple size={20} weight="bold" />
                  </button>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <div
                className={`font-medium text-slate-900 group-hover:text-zinc-500`}
              >
                {agendamento.horarioAgendamento} -{" "}
                {agendamento.terapeutaInfo?.nome}
              </div>
              <div className="text-slate-500 group-hover:text-zinc-500 flex items-center gap-1">
                {agendamento.pacienteInfo?.nome}
                {agendamento.pacienteInfo?.dt_nascimento &&
                  isBirthday(
                    agendamento.pacienteInfo.dt_nascimento,
                    agendamento.dataAgendamento,
                  ) && (
                    <BirthdayIndicator
                      birthDate={agendamento.pacienteInfo.dt_nascimento}
                      targetDate={agendamento.dataAgendamento}
                      size={14}
                    />
                  )}
              </div>
              <div className="text-sm italic text-slate-500 group-hover:text-zinc-500">
                {agendamento.tipoAgendamento} -{" "}
                {agendamento.modalidadeAgendamento}
              </div>
              <hr className="border-2 border-yellow-400" />

              {agendamento.statusAgendamento !== "Confirmado" && (
                <div className="text-base font-semibold text-orange-500 group-hover:text-orange-700">
                  {agendamento.statusAgendamento}
                </div>
              )}

              {agendamento.observacoesAgendamento && (
                <div className="text-xs mt-2 text-gray-600">
                  <strong>Obs:</strong> {agendamento.observacoesAgendamento}
                </div>
              )}
            </div>
          </div>
        ))}

        {agendamentos.length === 0 && (
          <div className="col-span-full p-6 text-center text-gray-500">
            Não há agendamentos sem sala para os filtros selecionados.
          </div>
        )}
      </div>
    </>
  );
};
