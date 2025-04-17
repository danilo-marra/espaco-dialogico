import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import agendamento from "models/agendamento.js";
import authMiddleware from "utils/authMiddleware.js";

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

    // Criar os agendamentos recorrentes utilizando o model
    const agendamentosRecorrentes = await agendamento.createRecurrences({
      recurrenceId,
      agendamentoBase,
      diasDaSemana,
      dataFimRecorrencia,
      periodicidade,
    });

    // Retornar a resposta com status 201 (Created) e os agendamentos criados
    return res.status(201).json({
      message: `${agendamentosRecorrentes.length} agendamentos recorrentes criados com sucesso`,
      data: agendamentosRecorrentes,
    });
  } catch (error) {
    console.error("Erro ao criar agendamentos recorrentes:", error);
    return res.status(500).json({
      message: "Erro ao criar agendamentos recorrentes",
      error: error.message,
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
      // Remover flags que não devem ser persistidas
      delete agendamentoData.updateAllRecurrences;

      // Atualizar todos os agendamentos com o mesmo ID de recorrência
      const atualizados = await agendamento.updateAllByRecurrenceId(
        recurrenceId,
        agendamentoData,
      );

      return res.status(200).json({
        message: `${atualizados.length} agendamentos recorrentes atualizados com sucesso`,
        data: atualizados,
      });
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

// Exportar o handler com tratamento de erros
export default router.handler(controller.errorHandlers);
