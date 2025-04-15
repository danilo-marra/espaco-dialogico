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
  // Obter o ID do agendamento a partir da URL
  const { id } = req.query;

  // Buscar o agendamento pelo ID
  const agendamentoEncontrado = await agendamento.getById(id);

  // Retornar a resposta com status 200 (OK)
  res.status(200).json(agendamentoEncontrado);
}

// Handler para atualizar um agendamento
async function putHandler(req, res) {
  // Obter o ID do agendamento a partir da URL
  const { id } = req.query;

  // Extrair os dados do corpo da requisição
  const agendamentoData = req.body;

  // Atualizar o agendamento
  const agendamentoAtualizado = await agendamento.update(id, agendamentoData);

  // Retornar a resposta com status 200 (OK)
  res.status(200).json(agendamentoAtualizado);
}

// Handler para excluir um agendamento
async function deleteHandler(req, res) {
  // Obter o ID do agendamento a partir da URL
  const { id } = req.query;

  // Excluir o agendamento
  await agendamento.remove(id);

  // Retornar a resposta com status 204 (No Content)
  res.status(204).end();
}

// Exportar o handler com tratamento de erros
export default router.handler(controller.errorHandlers);
