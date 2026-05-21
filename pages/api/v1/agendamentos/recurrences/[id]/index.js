import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import agendamento from "models/agendamento.js";
import sessao from "models/sessao.js";
import authMiddleware from "utils/authMiddleware.js";
import { requirePermission } from "utils/roleMiddleware.js";
import withTimeout from "utils/withTimeout.js";

// Criar o router
const router = createRouter();

// Aplicar middleware de autenticação para proteger as rotas
router.use(authMiddleware);
router.use(requirePermission("agendamentos"));

// Definir os handlers para cada método HTTP
router.get(getHandler);
router.post(postHandler);
router.put(putHandler);
router.delete(deleteHandler);

// Handler para buscar todos os agendamentos de uma recorrência
async function getHandler(req, res) {
  try {
    const { id: recurrenceId } = req.query;

    // Buscar todos os agendamentos com o mesmo ID de recorrência
    const agendamentosRecorrentes =
      await agendamento.getAgendamentoByRecurrenceId(recurrenceId);

    if (agendamentosRecorrentes.length === 0) {
      return res.status(404).json({
        message: "Nenhum agendamento encontrado com este ID de recorrência",
      });
    }

    return res.status(200).json(agendamentosRecorrentes);
  } catch (error) {
    console.error("Erro ao buscar agendamentos recorrentes:", error);
    return res.status(500).json({
      message: "Erro ao buscar agendamentos recorrentes",
      error: error.message,
    });
  }
}

// Handler para criar agendamentos recorrentes
async function postHandler(req, res) {
  const startTime = Date.now();

  try {
    const { id: recurrenceId } = req.query;
    let { agendamentoBase, diasDaSemana, dataFimRecorrencia, periodicidade } =
      req.body;

    // Validar os dados necessários
    if (
      !agendamentoBase ||
      !diasDaSemana ||
      !dataFimRecorrencia ||
      !periodicidade
    ) {
      return res.status(400).json({
        message: "Dados incompletos para criação de agendamentos recorrentes",
      });
    }

    // Verificar especificamente se terapeuta_id existe
    if (!agendamentoBase.terapeuta_id) {
      return res.status(400).json({
        message: "terapeuta_id é obrigatório no agendamentoBase",
      });
    }

    if (!agendamentoBase.paciente_id) {
      return res.status(400).json({
        message: "paciente_id é obrigatório no agendamentoBase",
      });
    }

    // Validações adicionais para evitar timeout
    if (!Array.isArray(diasDaSemana) || diasDaSemana.length === 0) {
      return res.status(400).json({
        message: "Pelo menos um dia da semana deve ser selecionado",
      });
    }

    // Validar período para evitar criação excessiva de agendamentos
    const dataInicio = new Date(agendamentoBase.dataAgendamento);
    const dataFim = new Date(dataFimRecorrencia);
    const diferencaDias = Math.ceil(
      (dataFim - dataInicio) / (1000 * 60 * 60 * 24),
    );

    if (diferencaDias > 365) {
      return res.status(400).json({
        message: "Período de recorrência muito longo. Máximo permitido: 1 ano",
      });
    }

    // Calcular o número estimado de agendamentos que serão criados
    const intervaloDias = periodicidade === "Semanal" ? 7 : 14;
    const numeroDeSemanas = Math.ceil(diferencaDias / intervaloDias);
    const numeroEstimado = numeroDeSemanas * diasDaSemana.length;

    // Limitar a 35 agendamentos máximo
    const LIMITE_MAXIMO_AGENDAMENTOS = 35;

    if (numeroEstimado > LIMITE_MAXIMO_AGENDAMENTOS) {
      // Calcular nova data fim para não exceder 35 agendamentos
      const semanasPermitidas = Math.floor(
        LIMITE_MAXIMO_AGENDAMENTOS / diasDaSemana.length,
      );
      const diasPermitidos = semanasPermitidas * intervaloDias;
      const novaDataFim = new Date(dataInicio);
      novaDataFim.setDate(dataInicio.getDate() + diasPermitidos);

      // Atualizar a data fim da recorrência
      dataFimRecorrencia = novaDataFim.toISOString().split("T")[0];
    }

    // Detectar ambiente e usar método otimizado para staging/produção
    const isProduction =
      process.env.NODE_ENV === "production" ||
      process.env.VERCEL_ENV === "production";
    const isStaging = process.env.VERCEL_ENV === "preview";

    let agendamentosRecorrentes;

    if (isProduction || isStaging) {
      // Criar os agendamentos recorrentes utilizando o método otimizado
      agendamentosRecorrentes =
        await agendamento.createRecurrencesOptimizedForStaging({
          recurrenceId,
          agendamentoBase,
          diasDaSemana,
          dataFimRecorrencia,
          periodicidade,
        });
    } else {
      // Criar os agendamentos recorrentes utilizando o método padrão
      agendamentosRecorrentes = await agendamento.createRecurrences({
        recurrenceId,
        agendamentoBase,
        diasDaSemana,
        dataFimRecorrencia,
        periodicidade,
      });
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Função auxiliar para mapear tipos de agendamento para tipos de sessão
    const mapearTipoAgendamentoParaTipoSessao = (tipoAgendamento) => {
      switch (tipoAgendamento) {
        case "Sessão":
          return "Atendimento";
        case "Orientação Parental":
          return "Atendimento";
        case "Visita Escolar":
          return "Visitar Escolar";
        case "Supervisão":
          return "Atendimento";
        case "Outros":
          return "Atendimento";
        default:
          return "Atendimento";
      }
    };

    // Função auxiliar para mapear status de agendamento para status de sessão
    const mapearStatusAgendamentoParaStatusSessao = (statusAgendamento) => {
      switch (statusAgendamento) {
        case "Confirmado":
          return "Pagamento Pendente";
        case "Cancelado":
          return "Pagamento Pendente";
        default:
          return "Pagamento Pendente";
      }
    };

    // Criar sessões para todos os agendamentos recorrentes criados
    const sessaoStartTime = Date.now();
    let sessoesCreated = 0;

    try {
      // Otimização: usar criação em lote para ambiente de staging/produção
      if (isProduction || isStaging) {
        // Preparar dados para criação em lote
        const sessoesData = agendamentosRecorrentes
          .filter(
            (agendamentoCreated) =>
              agendamentoCreated.statusAgendamento !== "Cancelado" &&
              (agendamentoCreated.sessaoRealizada || agendamentoCreated.falta),
          )
          .map((agendamentoCreated) => {
            return {
              terapeuta_id: agendamentoCreated.terapeutaId,
              paciente_id: agendamentoCreated.pacienteId,
              tipoSessao: mapearTipoAgendamentoParaTipoSessao(
                agendamentoCreated.tipoAgendamento,
              ),
              valorSessao: agendamentoCreated.valorAgendamento,
              statusSessao: mapearStatusAgendamentoParaStatusSessao(
                agendamentoCreated.statusAgendamento,
              ),
              agendamento_id: agendamentoCreated.id,
            };
          });

        try {
          // Tentar criação em lote primeiro
          sessoesCreated = await sessao.createBatch(sessoesData);
        } catch (batchError) {
          // Fallback: criar sessões individualmente
          for (const sessaoData of sessoesData) {
            try {
              await sessao.create(sessaoData);
              sessoesCreated++;
            } catch (individualError) {
              console.error(
                "❌ Erro ao criar sessão individual:",
                individualError.message,
              );
              // Continuar com as próximas sessões
            }
          }
        }
      } else {
        // Método original para desenvolvimento
        for (const agendamentoCreated of agendamentosRecorrentes) {
          // Só criar sessão se o agendamento não estiver cancelado e a flag sessaoRealizada OU falta for true
          if (
            agendamentoCreated.statusAgendamento !== "Cancelado" &&
            (agendamentoCreated.sessaoRealizada || agendamentoCreated.falta)
          ) {
            const sessaoData = {
              terapeuta_id: agendamentoCreated.terapeutaId,
              paciente_id: agendamentoCreated.pacienteId,
              tipoSessao: mapearTipoAgendamentoParaTipoSessao(
                agendamentoCreated.tipoAgendamento,
              ),
              valorSessao: agendamentoCreated.valorAgendamento,
              statusSessao: mapearStatusAgendamentoParaStatusSessao(
                agendamentoCreated.statusAgendamento,
              ),
              agendamento_id: agendamentoCreated.id,
            };

            await sessao.create(sessaoData);
            sessoesCreated++;
          }
        }
      }
    } catch (error) {
      const sessaoEndTime = Date.now();
      const sessaoDuration = sessaoEndTime - sessaoStartTime;
      console.error(
        `⚠️ Erro ao criar algumas sessões após ${sessaoDuration}ms:`,
        error.message,
      );
      // Não falhar o processo inteiro se houver erro na criação das sessões
    }

    // Retornar a resposta com status 201 (Created) e os agendamentos criados
    return res.status(201).json({
      message: `${agendamentosRecorrentes.length} agendamentos recorrentes criados com sucesso`,
      data: agendamentosRecorrentes,
      metadata: {
        duration: `${duration}ms`,
        count: agendamentosRecorrentes.length,
        sessoesCreated: sessoesCreated,
        numeroOriginalEstimado: numeroEstimado,
        numeroFinalCriado: agendamentosRecorrentes.length,
        limiteAjustado: numeroEstimado > LIMITE_MAXIMO_AGENDAMENTOS,
      },
    });
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.error(
      `Erro ao criar agendamentos recorrentes após ${duration}ms:`,
      error,
    );

    // Se for erro de validação, retornar status 400
    if (
      error.message?.includes("muito alto") ||
      error.message?.includes("Máximo permitido")
    ) {
      return res.status(400).json({
        message: error.message,
        error: "Validation Error",
      });
    }

    return res.status(500).json({
      message: "Erro ao criar agendamentos recorrentes",
      error: error.message,
      metadata: {
        duration: `${duration}ms`,
      },
    });
  }
}

// Handler para atualizar todos os agendamentos de uma recorrência
async function putHandler(req, res) {
  const startTime = Date.now();

  try {
    const { id: recurrenceId } = req.query;
    const agendamentoData = req.body;

    // Detectar ambiente para usar otimizações
    const isProduction =
      process.env.NODE_ENV === "production" ||
      process.env.VERCEL_ENV === "production";
    const isStaging = process.env.VERCEL_ENV === "preview";

    // Verificar se é para atualizar todos os agendamentos da recorrência
    const updateAllRecurrences =
      agendamentoData.updateAllRecurrences === true ||
      agendamentoData.updateAllRecorrences === true;

    if (updateAllRecurrences) {
      // Verificar se é para alterar o dia da semana
      const novoDiaSemana = agendamentoData.novoDiaSemana;

      // Remover flags que não devem ser persistidas
      delete agendamentoData.updateAllRecurrences;
      delete agendamentoData.updateAllRecorrences;
      delete agendamentoData.novoDiaSemana;

      let atualizados;
      const updateStartTime = Date.now();

      // Se for para alterar o dia da semana, usar função específica
      if (novoDiaSemana !== undefined && novoDiaSemana !== null) {
        if (isProduction || isStaging) {
          atualizados = await updateAllByRecurrenceIdWithNewWeekdayOptimized(
            recurrenceId,
            agendamentoData,
            novoDiaSemana,
          );
        } else {
          atualizados = await agendamento.updateAllByRecurrenceIdWithNewWeekday(
            recurrenceId,
            agendamentoData,
            novoDiaSemana,
          );
        }
      } else {
        if (isProduction || isStaging) {
          atualizados = await updateAllByRecurrenceIdOptimized(
            recurrenceId,
            agendamentoData,
          );
        } else {
          atualizados = await agendamento.updateAllByRecurrenceId(
            recurrenceId,
            agendamentoData,
          );
        }
      }

      const updateEndTime = Date.now();
      const updateDuration = updateEndTime - updateStartTime;

      // Atualizar sessões correspondentes aos agendamentos atualizados com otimização
      const sessaoStartTime = Date.now();

      let sessoesAtualizadas;
      if (isProduction || isStaging) {
        sessoesAtualizadas = await atualizarSessoesDeAgendamentosOtimizado(
          atualizados,
          agendamentoData,
        );
      } else {
        sessoesAtualizadas = await atualizarSessoesDeAgendamentos(
          atualizados,
          agendamentoData,
        );
      }

      const endTime = Date.now();
      const totalDuration = endTime - startTime;

      const message =
        novoDiaSemana !== undefined && novoDiaSemana !== null
          ? `${atualizados.length} agendamentos recorrentes atualizados com novo dia da semana`
          : `${atualizados.length} agendamentos recorrentes atualizados com sucesso`;

      return res.status(200).json({
        message,
        data: atualizados,
        metadata: {
          agendamentosAtualizados: atualizados.length,
          sessoesAtualizadas: sessoesAtualizadas,
          duration: `${totalDuration}ms`,
          agendamentosDuration: `${updateDuration}ms`,
          sessoesDuration: sessaoStartTime
            ? `${Date.now() - sessaoStartTime}ms`
            : "0ms",
        },
      });
    } else {
      // Se não for para atualizar todos, retorna erro pois esta rota é específica para recorrências
      return res.status(400).json({
        message:
          "Para atualizar um único agendamento, use a rota /agendamentos/:id",
      });
    }
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.error(
      `Erro ao atualizar agendamentos recorrentes após ${duration}ms:`,
      error,
    );
    return res.status(500).json({
      message: "Erro ao atualizar agendamentos recorrentes",
      error: error.message,
      metadata: {
        duration: `${duration}ms`,
      },
    });
  }
}

// Handler para excluir todos os agendamentos de uma recorrência
async function deleteHandler(req, res) {
  const startTime = Date.now();

  try {
    const { id: recurrenceId } = req.query;

    console.log(
      `🗑️ Iniciando exclusão de agendamentos recorrentes: ${recurrenceId}`,
    );

    // Primeiro, buscar todos os agendamentos que serão excluídos para excluir suas sessões
    const agendamentosParaExcluir =
      await agendamento.getAgendamentoByRecurrenceId(recurrenceId);

    if (agendamentosParaExcluir.length === 0) {
      return res.status(404).json({
        message: "Nenhum agendamento encontrado com este ID de recorrência",
      });
    }

    // Detectar ambiente para usar otimizações
    const isProduction =
      process.env.NODE_ENV === "production" ||
      process.env.VERCEL_ENV === "production";
    const isStaging = process.env.VERCEL_ENV === "preview";

    let sessoesExcluidas = 0;
    const sessaoStartTime = Date.now();

    try {
      if (isProduction || isStaging) {
        console.log(
          "🏭 Usando exclusão otimizada de sessões para staging/produção",
        );

        // Usar método otimizado: excluir todas as sessões de uma vez por agendamento_id
        const agendamentoIds = agendamentosParaExcluir.map((ag) => ag.id);
        sessoesExcluidas =
          await sessao.removeBatchByAgendamentosIds(agendamentoIds);
      } else {
        console.log(
          "🔧 Usando exclusão individual de sessões para desenvolvimento",
        );

        // Método original para desenvolvimento
        for (const agendamentoItem of agendamentosParaExcluir) {
          // Buscar e excluir sessões associadas a este agendamento
          const sessoesAssociadas = await sessao.getFiltered({
            agendamento_id: agendamentoItem.id,
          });

          for (const sessaoItem of sessoesAssociadas) {
            await sessao.remove(sessaoItem.id);
            sessoesExcluidas++;
          }
        }
      }

      const sessaoEndTime = Date.now();
      const _sessaoDuration = sessaoEndTime - sessaoStartTime;
      console.log(`✅ ${sessoesExcluidas} sessões excluídas com sucesso`);
    } catch (error) {
      const sessaoEndTime = Date.now();
      const _sessaoDuration = sessaoEndTime - sessaoStartTime;
      console.error(
        `⚠️ Erro ao excluir algumas sessões após ${_sessaoDuration}ms:`,
        error.message,
      );
      // Continuar com a exclusão dos agendamentos mesmo se houver erro nas sessões
    }

    // Excluir todos os agendamentos com o mesmo ID de recorrência
    console.log(
      `🗑️ Excluindo ${agendamentosParaExcluir.length} agendamentos recorrentes...`,
    );
    const agendamentoStartTime = Date.now();
    const resultado = await agendamento.removeAllByRecurrenceId(recurrenceId);
    const agendamentoEndTime = Date.now();
    const agendamentoDuration = agendamentoEndTime - agendamentoStartTime;

    const endTime = Date.now();
    const totalDuration = endTime - startTime;

    console.log(
      `✅ ${resultado.count} agendamentos excluídos em ${agendamentoDuration}ms`,
    );
    console.log(
      `✅ Processo de exclusão concluído em ${totalDuration}ms - startTime: ${startTime}, endTime: ${endTime}`,
    );

    return res.status(200).json({
      message: `${resultado.count} agendamentos recorrentes excluídos com sucesso`,
      count: resultado.count,
      sessoesExcluidas: sessoesExcluidas,
      metadata: {
        totalDuration: `${totalDuration}ms`,
        agendamentosDuration: `${agendamentoDuration}ms`,
        sessoesDuration: sessaoStartTime ? Date.now() - sessaoStartTime : 0,
        agendamentosExcluidos: resultado.count,
        sessoesExcluidas: sessoesExcluidas,
        ambiente: isProduction
          ? "production"
          : isStaging
            ? "staging"
            : "development",
      },
    });
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.error(
      `❌ Erro ao excluir agendamentos recorrentes após ${duration}ms:`,
      error,
    );
    return res.status(500).json({
      message: "Erro ao excluir agendamentos recorrentes",
      error: error.message,
      metadata: {
        duration: `${duration}ms`,
      },
    });
  }
}

// Detectar ambiente para definir timeout apropriado
const isProduction =
  process.env.NODE_ENV === "production" ||
  process.env.VERCEL_ENV === "production";
const isStaging = process.env.VERCEL_ENV === "preview";

// Timeout mais agressivo para staging (30 segundos) e produção (45 segundos)
const timeoutMs = isStaging ? 30000 : isProduction ? 45000 : 55000;

// Exportar o handler com tratamento de erros e timeout otimizado para ambiente
export default withTimeout(router.handler(controller.errorHandlers), timeoutMs);

// Função auxiliar para atualizar sessões associadas aos agendamentos
async function atualizarSessoesDeAgendamentos(agendamentosAtualizados) {
  console.log("🔄 Atualizando sessões dos agendamentos recorrentes...");
  let sessoesProcessadas = 0;

  for (const agendamentoAtualizado of agendamentosAtualizados) {
    const sessaoExistente = await sessao.getFiltered({
      agendamento_id: agendamentoAtualizado.id,
    });

    const sessaoRealizadaAtual = obterBooleanAgendamento(
      agendamentoAtualizado,
      "sessaoRealizada",
      "sessao_realizada",
    );
    const faltaAtual = obterBooleanAgendamento(
      agendamentoAtualizado,
      "falta",
      "falta",
    );
    const statusAtual = obterCampoAgendamento(
      agendamentoAtualizado,
      "statusAgendamento",
      "status_agendamento",
    );

    const shouldCreateSession =
      (sessaoRealizadaAtual || faltaAtual) && statusAtual !== "Cancelado";
    const sessionAlreadyExists = sessaoExistente && sessaoExistente.length > 0;

    if (shouldCreateSession) {
      if (sessionAlreadyExists) {
        const sessaoAssociada = sessaoExistente[0];
        const sessaoUpdateData = {};

        const tipoAgendamentoAtual = obterCampoAgendamento(
          agendamentoAtualizado,
          "tipoAgendamento",
          "tipo_agendamento",
        );
        const valorAgendamentoAtual = obterNumeroCampoAgendamento(
          agendamentoAtualizado,
          "valorAgendamento",
          "valor_agendamento",
        );

        if (tipoAgendamentoAtual !== undefined) {
          sessaoUpdateData.tipoSessao =
            mapearTipoAgendamentoParaTipoSessao(tipoAgendamentoAtual);
        }
        if (valorAgendamentoAtual !== undefined) {
          sessaoUpdateData.valorSessao = valorAgendamentoAtual;
        }

        if (Object.keys(sessaoUpdateData).length > 0) {
          await sessao.update(sessaoAssociada.id, sessaoUpdateData);
          sessoesProcessadas++;
        }
      } else {
        const tipoAgendamentoAtual = obterCampoAgendamento(
          agendamentoAtualizado,
          "tipoAgendamento",
          "tipo_agendamento",
        );
        const valorAgendamentoAtual = obterNumeroCampoAgendamento(
          agendamentoAtualizado,
          "valorAgendamento",
          "valor_agendamento",
        );
        const statusAgendamentoAtual = obterCampoAgendamento(
          agendamentoAtualizado,
          "statusAgendamento",
          "status_agendamento",
        );

        const newSessaoData = {
          terapeuta_id: obterCampoAgendamento(
            agendamentoAtualizado,
            "terapeuta_id",
            "terapeutaId",
          ),
          paciente_id: obterCampoAgendamento(
            agendamentoAtualizado,
            "paciente_id",
            "pacienteId",
          ),
          tipoSessao: mapearTipoAgendamentoParaTipoSessao(tipoAgendamentoAtual),
          valorSessao: valorAgendamentoAtual,
          statusSessao: mapearStatusAgendamentoParaStatusSessao(
            statusAgendamentoAtual,
          ),
          agendamento_id: agendamentoAtualizado.id,
        };
        await sessao.create(newSessaoData);
        sessoesProcessadas++;
      }
    } else if (sessionAlreadyExists) {
      await sessao.remove(sessaoExistente[0].id);
      sessoesProcessadas++;
    }
  }

  console.log(`✅ ${sessoesProcessadas} sessões processadas com sucesso`);

  return sessoesProcessadas;
}

// Função auxiliar para atualizar sessões associadas aos agendamentos (método otimizado)
async function atualizarSessoesDeAgendamentosOtimizado(
  agendamentosAtualizados,
) {
  console.log(
    "🔄 Atualizando sessões dos agendamentos recorrentes (otimizado)...",
  );
  let sessoesProcessadas = 0;

  try {
    const sessoesParaCriar = [];
    const sessoesParaAtualizar = [];
    const sessoesParaDeletar = [];

    for (const agendamentoAtualizado of agendamentosAtualizados) {
      const sessaoExistente = await sessao.getFiltered({
        agendamento_id: agendamentoAtualizado.id,
      });

      const sessaoRealizadaAtual = obterBooleanAgendamento(
        agendamentoAtualizado,
        "sessaoRealizada",
        "sessao_realizada",
      );
      const faltaAtual = obterBooleanAgendamento(
        agendamentoAtualizado,
        "falta",
        "falta",
      );
      const statusAtual = obterCampoAgendamento(
        agendamentoAtualizado,
        "statusAgendamento",
        "status_agendamento",
      );

      const shouldCreateSession =
        (sessaoRealizadaAtual || faltaAtual) && statusAtual !== "Cancelado";
      const sessionAlreadyExists =
        sessaoExistente && sessaoExistente.length > 0;

      if (shouldCreateSession) {
        if (sessionAlreadyExists) {
          const sessaoAssociada = sessaoExistente[0];
          const sessaoUpdateData = {
            id: sessaoAssociada.id,
          };

          const tipoAgendamentoAtual = obterCampoAgendamento(
            agendamentoAtualizado,
            "tipoAgendamento",
            "tipo_agendamento",
          );
          const valorAgendamentoAtual = obterNumeroCampoAgendamento(
            agendamentoAtualizado,
            "valorAgendamento",
            "valor_agendamento",
          );

          if (tipoAgendamentoAtual !== undefined) {
            sessaoUpdateData.tipoSessao =
              mapearTipoAgendamentoParaTipoSessao(tipoAgendamentoAtual);
          }
          if (valorAgendamentoAtual !== undefined) {
            sessaoUpdateData.valorSessao = valorAgendamentoAtual;
          }

          if (Object.keys(sessaoUpdateData).length > 1) {
            sessoesParaAtualizar.push(sessaoUpdateData);
          }
        } else {
          const tipoAgendamentoAtual = obterCampoAgendamento(
            agendamentoAtualizado,
            "tipoAgendamento",
            "tipo_agendamento",
          );
          const valorAgendamentoAtual = obterNumeroCampoAgendamento(
            agendamentoAtualizado,
            "valorAgendamento",
            "valor_agendamento",
          );
          const statusAgendamentoAtual = obterCampoAgendamento(
            agendamentoAtualizado,
            "statusAgendamento",
            "status_agendamento",
          );

          sessoesParaCriar.push({
            terapeuta_id: obterCampoAgendamento(
              agendamentoAtualizado,
              "terapeuta_id",
              "terapeutaId",
            ),
            paciente_id: obterCampoAgendamento(
              agendamentoAtualizado,
              "paciente_id",
              "pacienteId",
            ),
            tipoSessao:
              mapearTipoAgendamentoParaTipoSessao(tipoAgendamentoAtual),
            valorSessao: valorAgendamentoAtual,
            statusSessao: mapearStatusAgendamentoParaStatusSessao(
              statusAgendamentoAtual,
            ),
            agendamento_id: agendamentoAtualizado.id,
          });
        }
      } else if (sessionAlreadyExists) {
        sessoesParaDeletar.push(sessaoExistente[0].id);
      }
    }

    if (sessoesParaCriar.length > 0) {
      console.log(`🚀 BATCH: Criando ${sessoesParaCriar.length} sessões...`);
      try {
        sessoesProcessadas += await sessao.createBatch(sessoesParaCriar);
      } catch (batchError) {
        console.warn(
          "⚠️ Erro na criação em lote de sessões, tentando individual:",
          batchError.message,
        );
        for (const sessaoData of sessoesParaCriar) {
          try {
            await sessao.create(sessaoData);
            sessoesProcessadas++;
          } catch (individualError) {
            console.error(
              `❌ Erro ao criar sessão individual ${sessaoData.agendamento_id}:`,
              individualError.message,
            );
          }
        }
      }
    }

    if (sessoesParaAtualizar.length > 0) {
      console.log(
        `🚀 BATCH: Atualizando ${sessoesParaAtualizar.length} sessões...`,
      );
      try {
        sessoesProcessadas += await sessao.updateBatch(sessoesParaAtualizar);
      } catch (batchError) {
        console.warn(
          "⚠️ Erro na atualização em lote de sessões, tentando individual:",
          batchError.message,
        );
        for (const sessaoData of sessoesParaAtualizar) {
          try {
            const { id, ...updateData } = sessaoData;
            await sessao.update(id, updateData);
            sessoesProcessadas++;
          } catch (individualError) {
            console.error(
              `❌ Erro ao atualizar sessão individual ${sessaoData.id}:`,
              individualError.message,
            );
          }
        }
      }
    }

    if (sessoesParaDeletar.length > 0) {
      console.log(
        `🚀 BATCH: Deletando ${sessoesParaDeletar.length} sessões...`,
      );
      try {
        sessoesProcessadas += await sessao.removeBatch(sessoesParaDeletar);
      } catch (batchError) {
        console.warn(
          "⚠️ Erro na exclusão em lote de sessões, tentando individual:",
          batchError.message,
        );
        for (const sessaoId of sessoesParaDeletar) {
          try {
            await sessao.remove(sessaoId);
            sessoesProcessadas++;
          } catch (individualError) {
            console.error(
              `❌ Erro ao deletar sessão individual ${sessaoId}:`,
              individualError.message,
            );
          }
        }
      }
    }

    console.log(`✅ ${sessoesProcessadas} sessões processadas com sucesso`);
  } catch (error) {
    console.error(
      "⚠️ Erro ao processar sessões em recorrência:",
      error.message,
    );
    throw error;
  }

  return sessoesProcessadas;
}

function obterCampoAgendamento(obj, campoA, campoB) {
  if (!obj) return undefined;
  if (obj[campoA] !== undefined) return obj[campoA];
  return obj[campoB];
}

function obterNumeroCampoAgendamento(obj, campoA, campoB) {
  const valor = obterCampoAgendamento(obj, campoA, campoB);
  if (valor === undefined || valor === null) return valor;
  return Number(valor);
}

function obterBooleanAgendamento(obj, campoA, campoB) {
  const valor = obterCampoAgendamento(obj, campoA, campoB);
  return !!valor;
}

// Função otimizada para atualizar agendamentos recorrentes (sem alterar dia da semana)
async function updateAllByRecurrenceIdOptimized(recurrenceId, agendamentoData) {
  const database = (await import("infra/database.js")).default;

  console.log("🚀 BATCH: Atualizando agendamentos recorrentes em lote...");

  // Função auxiliar para adicionar campos
  function addField(fieldsToUpdate, values, paramCounter, fieldName, value) {
    if (value !== undefined && value !== null) {
      fieldsToUpdate.push(`${fieldName} = $${paramCounter}`);
      values.push(value);
      return paramCounter + 1;
    }
    return paramCounter;
  }

  try {
    await database.query({ text: "BEGIN" });

    // Preparar campos para atualização
    const fieldsToUpdate = [];
    const values = [recurrenceId];
    let paramCounter = 2;

    // Adicionar campos a serem atualizados
    paramCounter = addField(
      fieldsToUpdate,
      values,
      paramCounter,
      "paciente_id",
      agendamentoData.paciente_id,
    );
    paramCounter = addField(
      fieldsToUpdate,
      values,
      paramCounter,
      "terapeuta_id",
      agendamentoData.terapeuta_id,
    );
    paramCounter = addField(
      fieldsToUpdate,
      values,
      paramCounter,
      "horario_agendamento",
      agendamentoData.horarioAgendamento,
    );
    paramCounter = addField(
      fieldsToUpdate,
      values,
      paramCounter,
      "local_agendamento",
      agendamentoData.localAgendamento,
    );
    paramCounter = addField(
      fieldsToUpdate,
      values,
      paramCounter,
      "modalidade_agendamento",
      agendamentoData.modalidadeAgendamento,
    );
    paramCounter = addField(
      fieldsToUpdate,
      values,
      paramCounter,
      "tipo_agendamento",
      agendamentoData.tipoAgendamento,
    );
    paramCounter = addField(
      fieldsToUpdate,
      values,
      paramCounter,
      "valor_agendamento",
      agendamentoData.valorAgendamento,
    );
    paramCounter = addField(
      fieldsToUpdate,
      values,
      paramCounter,
      "status_agendamento",
      agendamentoData.statusAgendamento,
    );
    addField(
      fieldsToUpdate,
      values,
      paramCounter,
      "observacoes_agendamento",
      agendamentoData.observacoesAgendamento,
    );

    if (fieldsToUpdate.length === 0) {
      console.log("⚠️ Nenhum campo para atualizar");
      await database.query({ text: "COMMIT" });
      return [];
    }

    // Atualização em uma única query
    const result = await database.query({
      text: `
        UPDATE agendamentos
        SET ${fieldsToUpdate.join(", ")}, updated_at = NOW()
        WHERE recurrence_id = $1
        RETURNING *
      `,
      values: values,
    });

    await database.query({ text: "COMMIT" });

    console.log(
      `✅ BATCH: ${result.rows.length} agendamentos atualizados com sucesso`,
    );

    // Retornar os agendamentos atualizados no formato esperado
    return result.rows.map((row) => ({
      id: row.id,
      terapeutaId: row.terapeuta_id,
      pacienteId: row.paciente_id,
      recurrenceId: row.recurrence_id,
      dataAgendamento: row.data_agendamento,
      horarioAgendamento: row.horario_agendamento,
      localAgendamento: row.local_agendamento,
      modalidadeAgendamento: row.modalidade_agendamento,
      tipoAgendamento: row.tipo_agendamento,
      valorAgendamento: row.valor_agendamento,
      statusAgendamento: row.status_agendamento,
      observacoesAgendamento: row.observacoes_agendamento,
    }));
  } catch (error) {
    await database.query({ text: "ROLLBACK" });
    console.error("❌ BATCH: Erro ao atualizar agendamentos:", error);
    throw error;
  }
}

// Função otimizada para atualizar agendamentos recorrentes com novo dia da semana
async function updateAllByRecurrenceIdWithNewWeekdayOptimized(
  recurrenceId,
  agendamentoData,
  novoDiaSemana,
) {
  const database = (await import("infra/database.js")).default;
  const { format } = await import("date-fns");

  console.log("🚀 BATCH: Atualizando agendamentos com novo dia da semana...");

  try {
    await database.query({ text: "BEGIN" });

    // Primeiro, buscar todos os agendamentos da recorrência
    const agendamentosResult = await database.query({
      text: "SELECT * FROM agendamentos WHERE recurrence_id = $1 ORDER BY data_agendamento",
      values: [recurrenceId],
    });

    if (agendamentosResult.rows.length === 0) {
      throw new Error("Nenhum agendamento encontrado com este recurrence_id");
    }

    // Preparar dados para atualização em lote
    const updateCases = [];
    const updateValues = [];
    const agendamentoIds = [];
    let paramCounter = 1;

    agendamentosResult.rows.forEach((agendamento) => {
      // Calcular nova data baseada no novo dia da semana
      const dataAtual = new Date(agendamento.data_agendamento);
      const diaSemanaAtual = dataAtual.getDay();
      const diferenca = novoDiaSemana - diaSemanaAtual;

      const novaData = new Date(dataAtual);
      novaData.setDate(dataAtual.getDate() + diferenca);
      const novaDataFormatada = format(novaData, "yyyy-MM-dd");

      // Adicionar CASE para cada campo a ser atualizado
      updateCases.push(`WHEN id = $${paramCounter} THEN $${paramCounter + 1}`);
      updateValues.push(agendamento.id, novaDataFormatada);
      agendamentoIds.push(agendamento.id);
      paramCounter += 2;
    });

    // Adicionar outros campos se necessário
    const otherFields = [];
    if (agendamentoData.horarioAgendamento) {
      otherFields.push(`horario_agendamento = $${paramCounter}`);
      updateValues.push(agendamentoData.horarioAgendamento);
      paramCounter++;
    }
    if (agendamentoData.localAgendamento) {
      otherFields.push(`local_agendamento = $${paramCounter}`);
      updateValues.push(agendamentoData.localAgendamento);
      paramCounter++;
    }
    if (agendamentoData.modalidadeAgendamento) {
      otherFields.push(`modalidade_agendamento = $${paramCounter}`);
      updateValues.push(agendamentoData.modalidadeAgendamento);
      paramCounter++;
    }
    if (agendamentoData.tipoAgendamento) {
      otherFields.push(`tipo_agendamento = $${paramCounter}`);
      updateValues.push(agendamentoData.tipoAgendamento);
      paramCounter++;
    }
    if (agendamentoData.valorAgendamento) {
      otherFields.push(`valor_agendamento = $${paramCounter}`);
      updateValues.push(agendamentoData.valorAgendamento);
      paramCounter++;
    }
    if (agendamentoData.statusAgendamento) {
      otherFields.push(`status_agendamento = $${paramCounter}`);
      updateValues.push(agendamentoData.statusAgendamento);
      paramCounter++;
    }
    if (agendamentoData.observacoesAgendamento) {
      otherFields.push(`observacoes_agendamento = $${paramCounter}`);
      updateValues.push(agendamentoData.observacoesAgendamento);
      paramCounter++;
    }

    // Construir query com CASE WHEN para atualização em lote
    const otherFieldsSQL =
      otherFields.length > 0 ? `, ${otherFields.join(", ")}` : "";
    const placeholdersList = agendamentoIds
      .map((_, index) => `$${(index + 1) * 2 - 1}`)
      .join(", ");

    const result = await database.query({
      text: `
        UPDATE agendamentos
        SET data_agendamento = CASE ${updateCases.join(" ")} END,
            updated_at = NOW()
            ${otherFieldsSQL}
        WHERE id IN (${placeholdersList})
        RETURNING *
      `,
      values: updateValues,
    });

    await database.query({ text: "COMMIT" });

    console.log(
      `✅ BATCH: ${result.rows.length} agendamentos atualizados com novo dia da semana`,
    );

    return result.rows.map((row) => ({
      id: row.id,
      terapeutaId: row.terapeuta_id,
      pacienteId: row.paciente_id,
      recurrenceId: row.recurrence_id,
      dataAgendamento: row.data_agendamento,
      horarioAgendamento: row.horario_agendamento,
      localAgendamento: row.local_agendamento,
      modalidadeAgendamento: row.modalidade_agendamento,
      tipoAgendamento: row.tipo_agendamento,
      valorAgendamento: row.valor_agendamento,
      statusAgendamento: row.status_agendamento,
      observacoesAgendamento: row.observacoes_agendamento,
    }));
  } catch (error) {
    await database.query({ text: "ROLLBACK" });
    console.error("❌ BATCH: Erro ao atualizar com novo dia da semana:", error);
    throw error;
  }
}

// Função auxiliar para mapear tipos de agendamento para tipos de sessão
function mapearTipoAgendamentoParaTipoSessao(tipoAgendamento) {
  switch (tipoAgendamento) {
    case "Sessão":
      return "Atendimento";
    case "Orientação Parental":
      return "Atendimento";
    case "Visita Escolar":
      return "Visitar Escolar";
    case "Supervisão":
      return "Atendimento";
    case "Outros":
      return "Atendimento";
    default:
      return "Atendimento";
  }
}

// Função auxiliar para mapear status de agendamento para status de sessão
function mapearStatusAgendamentoParaStatusSessao(statusAgendamento) {
  switch (statusAgendamento) {
    case "Confirmado":
      return "Pagamento Pendente";
    case "Cancelado":
      return "Pagamento Pendente";
    default:
      return "Pagamento Pendente";
  }
}
