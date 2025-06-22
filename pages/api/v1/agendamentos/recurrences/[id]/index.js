import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import agendamento from "models/agendamento.js";
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
    const { agendamentoBase, diasDaSemana, dataFimRecorrencia, periodicidade } =
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

    // Retornar a resposta com status 201 (Created) e os agendamentos criados
    return res.status(201).json({
      message: `${agendamentosRecorrentes.length} agendamentos recorrentes criados com sucesso`,
      data: agendamentosRecorrentes,
      metadata: {
        duration: `${duration}ms`,
        count: agendamentosRecorrentes.length,
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

    // Excluir todos os agendamentos com o mesmo ID de recorrência
    const resultado = await agendamento.removeAllByRecurrenceId(recurrenceId);

    return res.status(200).json({
      message: `${resultado.count} agendamentos recorrentes excluídos com sucesso`,
      count: resultado.count,
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
