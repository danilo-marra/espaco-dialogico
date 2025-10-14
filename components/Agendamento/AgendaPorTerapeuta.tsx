import React from "react";
import { CalendarX, PencilSimple, TrashSimple } from "@phosphor-icons/react";
import { Agendamento, Terapeuta } from "../../tipos";
import { parseAnyDate, formatDateForDisplay } from "../../utils/dateUtils";
import { BirthdayIndicator } from "components/common/BirthdayIndicator";
import { isBirthday } from "utils/birthdayUtils";

interface AgendaPorTerapeutaProps {
  agendamentosPorTerapeuta: {
    terapeuta: Terapeuta;
    agendamentos: Agendamento[];
  }[];
  handleEditAgendamento: (_agendamento: Agendamento) => void;
  handleDeleteClick: (_agendamento: Agendamento) => void;
}

export const AgendaPorTerapeuta: React.FC<AgendaPorTerapeutaProps> = ({
  agendamentosPorTerapeuta,
  handleEditAgendamento,
  handleDeleteClick,
}) => (
  <div className="space-y-6">
    {agendamentosPorTerapeuta.map(({ terapeuta, agendamentos }) => (
      <div key={terapeuta.id} className="bg-white rounded shadow">
        <div className="bg-rosa text-white p-4">
          <h3 className="font-semibold">{terapeuta.nome}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Data</th>
                <th className="p-2 text-left">Horário</th>
                <th className="p-2 text-left">Paciente</th>
                <th className="p-2 text-left">Tipo</th>
                <th className="p-2 text-left">Local</th>
                <th className="p-2 text-left">Modalidade</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {agendamentos.map((agendamento) => (
                <tr
                  key={agendamento.id}
                  className={`border-t hover:bg-gray-50 cursor-pointer
                    ${
                      agendamento.statusAgendamento === "Cancelado"
                        ? "bg-red-50 line-through"
                        : agendamento.sessaoRealizada || agendamento.falta
                          ? "bg-green-50"
                          : ""
                    }`}
                  onClick={() => handleEditAgendamento(agendamento)}
                >
                  <td className="p-2">
                    {formatDateForDisplay(
                      parseAnyDate(agendamento.dataAgendamento),
                    )}
                  </td>
                  <td className="p-2">{agendamento.horarioAgendamento}</td>
                  <td className="p-2">
                    <div className="flex items-center gap-1">
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
                  </td>
                  <td className="p-2">{agendamento.tipoAgendamento}</td>
                  <td className="p-2">
                    <div className="flex items-center">
                      <div
                        className={`w-3 h-3 rounded-full mr-2 
                          ${
                            agendamento.localAgendamento === "Sala Verde"
                              ? "bg-green-500"
                              : agendamento.localAgendamento === "Sala Azul"
                                ? "bg-blue-500"
                                : agendamento.localAgendamento === "Sala 321"
                                  ? "bg-purple-500"
                                  : "bg-yellow-400"
                          }`}
                      ></div>
                      {agendamento.localAgendamento}
                    </div>
                  </td>
                  <td className="p-2">{agendamento.modalidadeAgendamento}</td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium
                        ${
                          agendamento.statusAgendamento === "Confirmado"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                    >
                      {agendamento.statusAgendamento}
                    </span>
                  </td>
                  <td className="p-2 space-x-2">
                    <button
                      type="button"
                      title="Editar Agendamento"
                      className="text-green-500 hover:text-green-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditAgendamento(agendamento);
                      }}
                    >
                      <PencilSimple size={18} weight="bold" />
                    </button>
                    <button
                      type="button"
                      title="Excluir Agendamento"
                      className="text-red-500 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(agendamento);
                      }}
                    >
                      <TrashSimple size={18} weight="bold" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ))}
    {agendamentosPorTerapeuta.length === 0 && (
      <div className="bg-white rounded shadow p-8 text-center text-gray-500">
        <CalendarX size={48} className="mx-auto mb-4 text-gray-400" />
        <p>Não foram encontrados agendamentos para os filtros selecionados.</p>
      </div>
    )}
  </div>
);
