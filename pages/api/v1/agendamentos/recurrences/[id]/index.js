import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import agendamento from "models/agendamento.js";
import sessao from "models/sessao.js";
import authMiddleware from "utils/authMiddleware.js";
import withTimeout from "utils/withTimeout.js";

// Criar o router
const router = createRouter();

// Aplicar middleware de autenticação para proteger as rotas
router.use(authMiddleware);

// Definir os handlers para cada método HTTP
router.post(postHandler);
router.put(putHandler);
router.delete(deleteHandler);

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
    let numeroAgendamentosAjustado = numeroEstimado;

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
      numeroAgendamentosAjustado = LIMITE_MAXIMO_AGENDAMENTOS;

      console.log(
        `⚠️ Limite de agendamentos ajustado: ${numeroEstimado} → ${numeroAgendamentosAjustado}`,
      );
    }

    console.log(
      `Iniciando criação de agendamentos recorrentes. Período: ${diferencaDias} dias`,
    );

    // Detectar ambiente e usar método otimizado para staging/produção
    const isProduction =
      process.env.NODE_ENV === "production" ||
      process.env.VERCEL_ENV === "production";
    const isStaging = process.env.VERCEL_ENV === "preview";

    let agendamentosRecorrentes;

    if (isProduction || isStaging) {
      console.log(
        "🏭 Usando método otimizado para ambiente de staging/produção",
      );
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
      console.log("🔧 Usando método padrão para ambiente de desenvolvimento");
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

    console.log(`Agendamentos criados em ${duration}ms`);

    // Criar sessões para todos os agendamentos recorrentes criados
    console.log("🔄 Criando sessões para os agendamentos recorrentes...");
    let sessoesCreated = 0;

    try {
      for (const agendamentoCreated of agendamentosRecorrentes) {
        // Só criar sessão se o agendamento não estiver cancelado
        if (agendamentoCreated.statusAgendamento !== "Cancelado") {
          // Mapear tipos de agendamento para tipos de sessão
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

          // Mapear status de agendamento para status de sessão
          const mapearStatusAgendamentoParaStatusSessao = (
            statusAgendamento,
          ) => {
            switch (statusAgendamento) {
              case "Confirmado":
                return "Pagamento Pendente";
              case "Remarcado":
                return "Pagamento Pendente";
              default:
                return "Pagamento Pendente";
            }
          };

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

      console.log(
        `✅ ${sessoesCreated} sessões criadas com sucesso para os agendamentos recorrentes`,
      );
    } catch (error) {
      console.error("⚠️ Erro ao criar algumas sessões:", error.message);
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
        limiteLabelizado: numeroEstimado > LIMITE_MAXIMO_AGENDAMENTOS,
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
  try {
    const { id: recurrenceId } = req.query;
    const agendamentoData = req.body;

    // Verificar se é para atualizar todos os agendamentos da recorrência
    const updateAllRecurrences = agendamentoData.updateAllRecurrences === true;

    if (updateAllRecurrences) {
      // Verificar se é para alterar o dia da semana
      const novoDiaSemana = agendamentoData.novoDiaSemana;

      // Remover flags que não devem ser persistidas
      delete agendamentoData.updateAllRecurrences;
      delete agendamentoData.novoDiaSemana;

      // Se for para alterar o dia da semana, usar função específica
      if (novoDiaSemana !== undefined && novoDiaSemana !== null) {
        const atualizados =
          await agendamento.updateAllByRecurrenceIdWithNewWeekday(
            recurrenceId,
            agendamentoData,
            novoDiaSemana,
          );

        // Atualizar sessões correspondentes aos agendamentos atualizados
        await atualizarSessoesDeAgendamentos(atualizados, agendamentoData);

        return res.status(200).json({
          message: `${atualizados.length} agendamentos recorrentes atualizados com novo dia da semana`,
          data: atualizados,
        });
      } else {
        // Atualizar todos os agendamentos com o mesmo ID de recorrência sem alterar dia
        const atualizados = await agendamento.updateAllByRecurrenceId(
          recurrenceId,
          agendamentoData,
        );

        // Atualizar sessões correspondentes aos agendamentos atualizados
        await atualizarSessoesDeAgendamentos(atualizados, agendamentoData);

        return res.status(200).json({
          message: `${atualizados.length} agendamentos recorrentes atualizados com sucesso`,
          data: atualizados,
        });
      }
    } else {
      // Se não for para atualizar todos, retorna erro pois esta rota é específica para recorrências
      return res.status(400).json({
        message:
          "Para atualizar um único agendamento, use a rota /agendamentos/:id",
      });
    }
  } catch (error) {
    console.error("Erro ao atualizar agendamentos recorrentes:", error);
    return res.status(500).json({
      message: "Erro ao atualizar agendamentos recorrentes",
      error: error.message,
    });
  }
}

// Handler para excluir todos os agendamentos de uma recorrência
async function deleteHandler(req, res) {
  try {
    const { id: recurrenceId } = req.query;

    // Primeiro, buscar todos os agendamentos que serão excluídos para excluir suas sessões
    const agendamentosParaExcluir =
      await agendamento.getAgendamentoByRecurrenceId(recurrenceId);

    // Excluir sessões associadas aos agendamentos
    console.log(
      "🗑️ Excluindo sessões associadas aos agendamentos recorrentes...",
    );
    let sessoesExcluidas = 0;

    try {
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

      console.log(`✅ ${sessoesExcluidas} sessões excluídas com sucesso`);
    } catch (error) {
      console.error("⚠️ Erro ao excluir algumas sessões:", error.message);
      // Continuar com a exclusão dos agendamentos mesmo se houver erro nas sessões
    }

    // Excluir todos os agendamentos com o mesmo ID de recorrência
    const resultado = await agendamento.removeAllByRecurrenceId(recurrenceId);

    return res.status(200).json({
      message: `${resultado.count} agendamentos recorrentes excluídos com sucesso`,
      count: resultado.count,
      sessoesExcluidas: sessoesExcluidas,
    });
  } catch (error) {
    console.error("Erro ao excluir agendamentos recorrentes:", error);
    return res.status(500).json({
      message: "Erro ao excluir agendamentos recorrentes",
      error: error.message,
    });
  }
}

// Exportar o handler com tratamento de erros e timeout aumentado para staging
export default withTimeout(router.handler(controller.errorHandlers), 55000);

// Função auxiliar para atualizar sessões associadas aos agendamentos
async function atualizarSessoesDeAgendamentos(
  agendamentosAtualizados,
  agendamentoData,
) {
  console.log("🔄 Atualizando sessões dos agendamentos recorrentes...");
  let sessoesAtualizadas = 0;

  try {
    for (const agendamentoAtualizado of agendamentosAtualizados) {
      // Buscar sessões associadas a este agendamento
      const sessoesAssociadas = await sessao.getFiltered({
        agendamento_id: agendamentoAtualizado.id,
      });

      for (const sessaoAssociada of sessoesAssociadas) {
        // Preparar dados para atualização da sessão
        const sessaoUpdateData = {};

        // Mapear campos do agendamento para a sessão se foram alterados
        if (agendamentoData.tipoAgendamento) {
          sessaoUpdateData.tipoSessao = mapearTipoAgendamentoParaTipoSessao(
            agendamentoData.tipoAgendamento,
          );
        }

        if (agendamentoData.valorAgendamento !== undefined) {
          sessaoUpdateData.valorSessao = agendamentoData.valorAgendamento;
        }

        if (agendamentoData.statusAgendamento) {
          sessaoUpdateData.statusSessao =
            mapearStatusAgendamentoParaStatusSessao(
              agendamentoData.statusAgendamento,
            );
        }

        // Se há dados para atualizar, fazer a atualização
        if (Object.keys(sessaoUpdateData).length > 0) {
          await sessao.update(sessaoAssociada.id, sessaoUpdateData);
          sessoesAtualizadas++;
        }
      }
    }

    console.log(`✅ ${sessoesAtualizadas} sessões atualizadas com sucesso`);
  } catch (error) {
    console.error("⚠️ Erro ao atualizar algumas sessões:", error.message);
    // Não falhar o processo se houver erro na atualização das sessões
  }

  return sessoesAtualizadas;
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
    case "Remarcado":
      return "Pagamento Pendente";
    default:
      return "Pagamento Pendente";
  }
}
