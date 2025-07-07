import { CaretDown, CaretUp, CalendarCheck } from "@phosphor-icons/react";
import React from "react";
import { Sessao } from "tipos";
import { formatSessaoDate, parseAnyDate } from "utils/dateUtils";
import {
  getNotaFiscalStatusColor,
  getPagamentoStatusColor,
} from "utils/statusColors";
import { currencyFormatter } from "utils/formatter";

// Função para determinar o estado do checkbox de um grupo
const getGroupRepasseState = (sessoes: Sessao[]) => {
  const totalSessoes = sessoes.length;
  const sessoesComRepasse = sessoes.filter((s) => s.repasseRealizado).length;

  if (sessoesComRepasse === 0) return "none"; // nenhuma marcada
  if (sessoesComRepasse === totalSessoes) return "all"; // todas marcadas
  return "partial"; // algumas marcadas
};

// Função auxiliar para obter o valor de repasse correto
function obterValorRepasse(sessao: Sessao): number {
  // Se existe um valor de repasse personalizado, use-o
  if (sessao.valorRepasse !== undefined && sessao.valorRepasse !== null) {
    return Number(sessao.valorRepasse);
  }

  // Caso contrário, calcular com base na regra padrão
  if (sessao.terapeutaInfo?.dt_entrada) {
    return calcularRepasse(sessao.valorSessao, sessao.terapeutaInfo.dt_entrada);
  }

  // Fallback (não deveria acontecer, mas por segurança)
  return sessao.valorSessao * 0.45;
}

// Função para calcular repasse baseado no tempo de casa do terapeuta
const calcularRepasse = (
  valorSessao: number,
  dtEntrada: Date | string,
): number => {
  if (!valorSessao || !dtEntrada) return 0;

  // Converter string para data se necessário
  const dataEntrada =
    typeof dtEntrada === "string" ? parseAnyDate(dtEntrada) : dtEntrada;

  // Verificar se a data é válida
  if (isNaN(dataEntrada.getTime())) return 0;

  // Calcular diferença em anos de forma mais precisa
  const hoje = new Date();

  // Calcular a diferença em milissegundos
  const diferencaEmMilissegundos = hoje.getTime() - dataEntrada.getTime();

  // Um ano em milissegundos (considerando anos bissextos)
  const umAnoEmMilissegundos = 365.25 * 24 * 60 * 60 * 1000;

  // Calcular anos na clínica
  const anosNaClinica = diferencaEmMilissegundos / umAnoEmMilissegundos;

  // Determinar percentual de repasse
  const percentualRepasse = anosNaClinica >= 1 ? 0.5 : 0.45;

  return valorSessao * percentualRepasse;
};

const getGroupPagamentoState = (sessoes: Sessao[]) => {
  const totalSessoes = sessoes.length;
  const sessoesComPagamento = sessoes.filter(
    (s) => s.pagamentoRealizado,
  ).length;

  if (sessoesComPagamento === 0) return "none"; // nenhuma marcada
  if (sessoesComPagamento === totalSessoes) return "all"; // todas marcadas
  return "partial"; // algumas marcadas
};

interface SessoesTableProps {
  groupedSessoes: Record<string, Sessao[]>;
  canEdit: boolean;
  handleEditSessao: (_sessao: Sessao) => void;
  handleBulkUpdateRepasse: (
    _sessoes: Sessao[],
    _repasseRealizado: boolean,
    _groupId: string,
    _groupName: string,
  ) => void;
  loadingBulkUpdate: string | null;
  expandedTherapists: string[];
  toggleAccordion: (_type: "terapeuta" | "paciente", _id: string) => void;
  handleBulkUpdatePagamento: (
    _sessoes: Sessao[],
    _pagamentoRealizado: boolean,
    _groupId: string,
    _groupName: string,
  ) => void;
  loadingBulkPagamento: string | null;
  expandedPatients: string[];
}

export const SessoesTable: React.FC<SessoesTableProps> = ({
  groupedSessoes,
  canEdit,
  handleEditSessao,
  handleBulkUpdateRepasse,
  loadingBulkUpdate,
  expandedTherapists,
  toggleAccordion,
  handleBulkUpdatePagamento,
  loadingBulkPagamento,
  expandedPatients,
}) => {
  // Função para agrupar sessões por terapeuta e depois por paciente
  const groupByTerapeutaAndPaciente = (sessoes: Record<string, Sessao[]>) => {
    const result: Record<string, Record<string, Sessao[]>> = {};

    Object.entries(sessoes).forEach(([terapeutaId, sessoesDoTerapeuta]) => {
      result[terapeutaId] = {};

      sessoesDoTerapeuta.forEach((sessao) => {
        const pacienteId = sessao.paciente_id.toString();
        if (!result[terapeutaId][pacienteId]) {
          result[terapeutaId][pacienteId] = [];
        }
        result[terapeutaId][pacienteId].push(sessao);
      });
    });

    return result;
  };

  const groupedData = groupByTerapeutaAndPaciente(groupedSessoes);

  if (Object.keys(groupedData).length === 0) {
    return (
      <div className="text-center py-12 px-4 bg-white rounded-lg shadow-sm">
        <div className="max-w-md mx-auto">
          <CalendarCheck size={64} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhuma sessão encontrada
          </h3>
          <p className="text-gray-600">
            Tente ajustar os filtros de busca para encontrar o que está
            procurando.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(groupedData).map(([terapeutaId, pacientesSessoes]) => {
        const allSessoesDoTerapeuta = Object.values(pacientesSessoes).flat();
        const groupRepasseState = getGroupRepasseState(allSessoesDoTerapeuta);
        const terapeutaNome =
          allSessoesDoTerapeuta[0].terapeutaInfo?.nome ||
          "Terapeuta Não Atribuído";
        const totalRepasseTerapeuta = allSessoesDoTerapeuta.reduce(
          (total, sessao) => total + obterValorRepasse(sessao),
          0,
        );
        const isTerapeutaExpanded = expandedTherapists.includes(terapeutaId);

        return (
          <div
            key={terapeutaId}
            className="bg-white rounded-lg shadow-sm overflow-hidden"
          >
            {/* Cabeçalho do Terapeuta */}
            <div
              className="bg-gray-100 border-b border-gray-200 px-4 py-3 cursor-pointer"
              onClick={() => toggleAccordion("terapeuta", terapeutaId)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {terapeutaNome}
                  </h3>
                  <span className="text-sm text-gray-600">
                    ({allSessoesDoTerapeuta.length}{" "}
                    {allSessoesDoTerapeuta.length === 1 ? "sessão" : "sessões"})
                  </span>
                  <span className="text-sm font-bold text-green-700">
                    Repasse a realizar:{" "}
                    {currencyFormatter.format(totalRepasseTerapeuta)}
                  </span>
                  {canEdit && (
                    <div
                      className="flex items-center space-x-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={groupRepasseState === "all"}
                        ref={(input) => {
                          if (input) {
                            input.indeterminate =
                              groupRepasseState === "partial";
                          }
                        }}
                        onChange={(e) =>
                          handleBulkUpdateRepasse(
                            allSessoesDoTerapeuta,
                            e.target.checked,
                            terapeutaId,
                            terapeutaNome,
                          )
                        }
                        disabled={loadingBulkUpdate === terapeutaId}
                        className="h-4 w-4 text-azul focus:ring-azul border-gray-300 rounded"
                        title={
                          groupRepasseState === "all"
                            ? "Desmarcar repasse de todas as sessões"
                            : "Marcar repasse de todas as sessões"
                        }
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Repasse Realizado
                        {loadingBulkUpdate === terapeutaId && "..."}
                      </span>
                    </div>
                  )}
                </div>
                {isTerapeutaExpanded ? (
                  <CaretUp size={20} />
                ) : (
                  <CaretDown size={20} />
                )}
              </div>
            </div>

            {/* Pacientes do Terapeuta (Conteúdo do Acordeão) */}
            {isTerapeutaExpanded && (
              <div className="p-4 space-y-3">
                {Object.entries(pacientesSessoes).map(
                  ([pacienteId, sessoesDoPaciente]) => {
                    const pacienteKey = `${terapeutaId}-${pacienteId}`;
                    const isPacienteExpanded =
                      expandedPatients.includes(pacienteKey);
                    const pacienteNome =
                      sessoesDoPaciente[0].pacienteInfo?.nome ||
                      "Paciente Não Identificado";
                    const totalSessoesPaciente = sessoesDoPaciente.reduce(
                      (acc, s) => acc + s.valorSessao,
                      0,
                    );
                    const groupPagamentoState =
                      getGroupPagamentoState(sessoesDoPaciente);

                    return (
                      <div
                        key={pacienteKey}
                        className="border border-gray-200 rounded-md"
                      >
                        {/* Cabeçalho do Paciente */}
                        <div
                          className="bg-gray-50 px-4 py-2 cursor-pointer"
                          onClick={() =>
                            toggleAccordion("paciente", pacienteKey)
                          }
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="font-semibold text-gray-800">
                                {pacienteNome}
                              </span>
                              <span className="text-sm text-gray-500">
                                ({sessoesDoPaciente.length}{" "}
                                {sessoesDoPaciente.length === 1
                                  ? "sessão"
                                  : "sessões"}
                                )
                              </span>
                              <span className="text-sm font-semibold text-blue-600">
                                Valor a cobrar:{" "}
                                {currencyFormatter.format(totalSessoesPaciente)}
                              </span>
                              {canEdit && (
                                <div
                                  className="flex items-center space-x-2"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <input
                                    type="checkbox"
                                    checked={groupPagamentoState === "all"}
                                    ref={(input) => {
                                      if (input) {
                                        input.indeterminate =
                                          groupPagamentoState === "partial";
                                      }
                                    }}
                                    onChange={(e) =>
                                      handleBulkUpdatePagamento(
                                        sessoesDoPaciente,
                                        e.target.checked,
                                        pacienteKey,
                                        pacienteNome,
                                      )
                                    }
                                    disabled={
                                      loadingBulkPagamento === pacienteKey
                                    }
                                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                    title={
                                      groupPagamentoState === "all"
                                        ? "Desmarcar pagamento de todas as sessões"
                                        : "Marcar pagamento de todas as sessões"
                                    }
                                  />
                                  <span className="text-sm font-medium text-gray-600">
                                    Pagamento Recebido
                                    {loadingBulkPagamento === pacienteKey &&
                                      "..."}
                                  </span>
                                </div>
                              )}
                            </div>
                            {isPacienteExpanded ? (
                              <CaretUp size={16} />
                            ) : (
                              <CaretDown size={16} />
                            )}
                          </div>
                        </div>

                        {/* Lista de Sessões do Paciente */}
                        {isPacienteExpanded && (
                          <ul className="divide-y divide-gray-200">
                            {sessoesDoPaciente.map((sessao) => (
                              <li
                                key={sessao.id}
                                className="px-4 py-3 hover:bg-gray-50/50 transition-colors cursor-pointer grid grid-cols-5 gap-4 items-center"
                                onClick={() =>
                                  canEdit && handleEditSessao(sessao)
                                }
                              >
                                <div className="text-sm text-gray-800">
                                  <p className="font-medium">
                                    {formatSessaoDate(sessao)}
                                  </p>
                                  {/* Indicador de falta */}
                                  {sessao.agendamentoInfo?.falta && (
                                    <p className="text-xs text-red-600 font-medium mt-1">
                                      Falta / Remarcação em menos de 24h
                                    </p>
                                  )}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {sessao.tipoSessao}
                                </div>
                                <div className="text-sm font-semibold text-gray-900">
                                  {currencyFormatter.format(sessao.valorSessao)}
                                </div>
                                <div>
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getNotaFiscalStatusColor(
                                      sessao.notaFiscal || "Não Emitida",
                                    )}`}
                                  >
                                    {sessao.notaFiscal}
                                  </span>
                                </div>
                                <div>
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPagamentoStatusColor(
                                      sessao.pagamentoRealizado,
                                    )}`}
                                  >
                                    {sessao.pagamentoRealizado
                                      ? "Pagamento realizado"
                                      : "Pagamento pendente"}
                                  </span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  },
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
