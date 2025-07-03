import { CaretDown, CaretUp, CalendarCheck } from "@phosphor-icons/react";
import React from "react";
import { Sessao } from "tipos";
import { formatSessaoDate, parseAnyDate } from "utils/dateUtils";
import {
  getNotaFiscalStatusColor,
  getPagamentoStatusColor,
} from "utils/statusColors";

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
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-rosa text-white">
            <tr>
              <th className="p-3 text-left text-sm font-medium">
                Terapeuta/Paciente
              </th>
              <th className="p-3 text-left text-sm font-medium">Data</th>
              <th className="p-3 text-left text-sm font-medium">Tipo</th>
              <th className="p-3 text-left text-sm font-medium">Valor</th>
              <th className="p-3 text-center text-sm font-medium">
                Nota Fiscal
              </th>
              <th className="p-3 text-center text-sm font-medium">Pagamento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {Object.keys(groupedData).length > 0 ? (
              Object.entries(groupedData).map(
                ([terapeutaId, pacientesSessoes]) => {
                  const allSessoesDoTerapeuta =
                    Object.values(pacientesSessoes).flat();
                  const groupRepasseState = getGroupRepasseState(
                    allSessoesDoTerapeuta,
                  );
                  const terapeutaNome =
                    allSessoesDoTerapeuta[0].terapeutaInfo?.nome ||
                    "Terapeuta Não Atribuído";

                  // Calcular total de repasse do terapeuta
                  const totalRepasseTerapeuta = allSessoesDoTerapeuta.reduce(
                    (total, sessao) => total + obterValorRepasse(sessao),
                    0,
                  );

                  return (
                    <React.Fragment key={terapeutaId}>
                      {/* Linha do Terapeuta */}
                      <tr
                        className="bg-gray-200 text-gray-900 hover:bg-gray-200 cursor-pointer"
                        onClick={(e) => {
                          if (
                            (e.target as HTMLElement).closest(
                              'input[type="checkbox"]',
                            )
                          ) {
                            return;
                          }
                          toggleAccordion("terapeuta", terapeutaId);
                        }}
                      >
                        <td colSpan={6} className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="font-bold text-gray-800">
                                {terapeutaNome} ({allSessoesDoTerapeuta.length}{" "}
                                {allSessoesDoTerapeuta.length === 1
                                  ? "sessão"
                                  : "sessões"}
                                )
                              </span>
                              <span className="text-sm font-semibold text-gray-600">
                                Repasse ao Terapeuta: R${" "}
                                {totalRepasseTerapeuta
                                  .toFixed(2)
                                  .replace(".", ",")}
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
                                    onChange={async (e) => {
                                      const newState = e.target.checked;
                                      await handleBulkUpdateRepasse(
                                        allSessoesDoTerapeuta,
                                        newState,
                                        terapeutaId,
                                        terapeutaNome,
                                      );
                                    }}
                                    disabled={loadingBulkUpdate === terapeutaId}
                                    className="h-4 w-4 text-azul focus:ring-azul border-gray-300 rounded"
                                    title={
                                      groupRepasseState === "all"
                                        ? "Desmarcar repasse de todas as sessões"
                                        : groupRepasseState === "partial"
                                          ? "Marcar repasse de todas as sessões (algumas já marcadas)"
                                          : "Marcar repasse de todas as sessões"
                                    }
                                  />
                                  <span className="text-sm font-semibold text-gray-600">
                                    Repasse realizado{" "}
                                    {loadingBulkUpdate === terapeutaId &&
                                      "(Atualizando...)"}
                                  </span>
                                </div>
                              )}
                            </div>
                            {expandedTherapists.includes(terapeutaId) ? (
                              <CaretUp size={20} />
                            ) : (
                              <CaretDown size={20} />
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Pacientes do Terapeuta */}
                      {expandedTherapists.includes(terapeutaId) &&
                        Object.entries(pacientesSessoes).map(
                          ([pacienteId, sessoesDoPaciente]) => {
                            const groupPagamentoState =
                              getGroupPagamentoState(sessoesDoPaciente);
                            const pacienteNome =
                              sessoesDoPaciente[0].pacienteInfo?.nome ||
                              "Paciente Não Atribuído";

                            // Calcular total das sessões do paciente
                            const totalSessoesPaciente =
                              sessoesDoPaciente.reduce(
                                (total, sessao) => total + sessao.valorSessao,
                                0,
                              );

                            const pacienteKey = `${terapeutaId}-${pacienteId}`;

                            return (
                              <React.Fragment key={pacienteKey}>
                                {/* Linha do Paciente */}
                                <tr
                                  className="bg-gray-100 hover:bg-gray-200 cursor-pointer"
                                  onClick={(e) => {
                                    if (
                                      (e.target as HTMLElement).closest(
                                        'input[type="checkbox"]',
                                      )
                                    ) {
                                      return;
                                    }
                                    toggleAccordion("paciente", pacienteKey);
                                  }}
                                >
                                  <td colSpan={6} className="p-3 pl-8">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-3">
                                        <span className="font-semibold text-gray-800">
                                          {pacienteNome} (
                                          {sessoesDoPaciente.length}{" "}
                                          {sessoesDoPaciente.length === 1
                                            ? "sessão"
                                            : "sessões"}
                                          )
                                        </span>
                                        <span className="text-sm font-semibold text-gray-600">
                                          Total: R${" "}
                                          {totalSessoesPaciente
                                            .toFixed(2)
                                            .replace(".", ",")}
                                        </span>
                                        {canEdit && (
                                          <div
                                            className="flex items-center space-x-2"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <input
                                              type="checkbox"
                                              checked={
                                                groupPagamentoState === "all"
                                              }
                                              ref={(input) => {
                                                if (input) {
                                                  input.indeterminate =
                                                    groupPagamentoState ===
                                                    "partial";
                                                }
                                              }}
                                              onChange={async (e) => {
                                                const newState =
                                                  e.target.checked;
                                                await handleBulkUpdatePagamento(
                                                  sessoesDoPaciente,
                                                  newState,
                                                  pacienteKey,
                                                  pacienteNome,
                                                );
                                              }}
                                              disabled={
                                                loadingBulkPagamento ===
                                                pacienteKey
                                              }
                                              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                              title={
                                                groupPagamentoState === "all"
                                                  ? "Desmarcar pagamento de todas as sessões"
                                                  : groupPagamentoState ===
                                                      "partial"
                                                    ? "Marcar pagamento de todas as sessões (algumas já marcadas)"
                                                    : "Marcar pagamento de todas as sessões"
                                              }
                                            />
                                            <span className="text-sm font-semibold text-gray-600">
                                              Pagamento recebido{" "}
                                              {loadingBulkPagamento ===
                                                pacienteKey &&
                                                "(Atualizando...)"}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                      {expandedPatients.includes(
                                        pacienteKey,
                                      ) ? (
                                        <CaretUp size={16} />
                                      ) : (
                                        <CaretDown size={16} />
                                      )}
                                    </div>
                                  </td>
                                </tr>

                                {/* Sessões do Paciente */}
                                {expandedPatients.includes(pacienteKey) &&
                                  sessoesDoPaciente.map((sessao, index) => {
                                    const dataExibicao =
                                      formatSessaoDate(sessao);

                                    return (
                                      <tr
                                        key={sessao.id}
                                        className={`hover:bg-blue-50 transition-colors cursor-pointer ${
                                          index % 2 === 0
                                            ? "bg-white"
                                            : "bg-gray-50/50"
                                        }`}
                                        onClick={() =>
                                          canEdit && handleEditSessao(sessao)
                                        }
                                      >
                                        <td className="p-3 pl-16 text-sm text-gray-600">
                                          <div className="font-medium text-gray-500 text-xs">
                                            Sessão individual
                                          </div>
                                        </td>
                                        <td className="p-3 text-sm text-gray-600">
                                          {dataExibicao}
                                        </td>
                                        <td className="p-3 text-sm text-gray-600">
                                          {sessao.tipoSessao}
                                        </td>
                                        <td className="p-3">
                                          <div className="text-sm font-semibold text-gray-900">
                                            R${" "}
                                            {sessao.valorSessao
                                              ?.toFixed(2)
                                              .replace(".", ",")}
                                          </div>
                                        </td>
                                        <td className="p-3 text-center">
                                          <span
                                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getNotaFiscalStatusColor(
                                              sessao.notaFiscal ||
                                                "Não Emitida",
                                            )}`}
                                          >
                                            {sessao.notaFiscal}
                                          </span>
                                        </td>
                                        <td className="p-3 text-center">
                                          <div className="flex justify-center">
                                            <span
                                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPagamentoStatusColor(sessao.pagamentoRealizado)}`}
                                            >
                                              {sessao.pagamentoRealizado
                                                ? "✓ Realizado"
                                                : "Pendente"}
                                            </span>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                              </React.Fragment>
                            );
                          },
                        )}
                    </React.Fragment>
                  );
                },
              )
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-12 px-4">
                  <div className="max-w-md mx-auto">
                    <CalendarCheck
                      size={64}
                      className="mx-auto mb-4 text-gray-300"
                    />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Nenhuma sessão encontrada
                    </h3>
                    <p className="text-gray-600">
                      Tente ajustar os filtros de busca para encontrar o que
                      está procurando.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
