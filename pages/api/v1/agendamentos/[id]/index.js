import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import agendamento from "models/agendamento.js";
import authMiddleware from "utils/authMiddleware.js";

// Criar o router
const router = createRouter();

// Aplicar middleware de autenticação para proteger as rotas
router.use(authMiddleware);

// Definir os handlers para cada método HTTP
router.get(getHandler);
router.put(putHandler);
router.delete(deleteHandler);

// Handler para obter um agendamento específico
async function getHandler(req, res) {
  try {
    // Obter o ID do agendamento a partir da URL
    const { id } = req.query;

    // Buscar o agendamento pelo ID
    const agendamentoFound = await agendamento.getById(id);

    // Retornar a resposta com status 200 (OK)
    res.status(200).json(agendamentoFound);
  } catch (error) {
    console.error("Erro ao buscar agendamento:", error);
    res.status(404).json({
      message: "Agendamento não encontrado",
      error: error.message,
    });
  }
}

// Handler para atualizar um agendamento
async function putHandler(req, res) {
  try {
    // Obter o ID do agendamento a partir da URL
    const { id } = req.query;

    // Extrair os dados do corpo da requisição
    const agendamentoData = req.body;

    // Verificar se é para atualizar todos os agendamentos da recorrência
    const updateAllRecurrences = agendamentoData.updateAllRecurrences === true;

    // Se o agendamento faz parte de uma recorrência e a flag updateAllRecurrences está ativa
    if (updateAllRecurrences && agendamentoData.recurrenceId) {
      // Redirecionar para a API de recorrências
      return res.redirect(
        307,
        `/api/v1/agendamentos/recurrences/${agendamentoData.recurrenceId}`,
      );
    }

    // Remove a flag que não deve ser persistida no banco
    delete agendamentoData.updateAllRecurrences;

    // Atualizar apenas este agendamento específico
    const agendamentoAtualizado = await agendamento.update(id, agendamentoData);

    // Retornar a resposta com status 200 (OK)
    res.status(200).json(agendamentoAtualizado);
  } catch (error) {
    console.error("Erro ao atualizar agendamento:", error);
    res.status(500).json({
      message: "Erro ao atualizar agendamento",
      error: error.message,
    });
  }
}

// Handler para excluir um agendamento
async function deleteHandler(req, res) {
  try {
    // Obter o ID do agendamento a partir da URL
    const { id } = req.query;

    // Excluir o agendamento
    await agendamento.remove(id);

    // Retornar a resposta com status 200 (OK)
    res.status(200).json({ message: "Agendamento excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir agendamento:", error);
    res.status(500).json({
      message: "Erro ao excluir agendamento",
      error: error.message,
    });
  }
}

// Exportar o handler com tratamento de erros
export default router.handler(controller.errorHandlers);
