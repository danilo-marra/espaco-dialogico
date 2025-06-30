import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import authMiddleware from "utils/authMiddleware.js";

// Criar o router
const router = createRouter();

// Aplicar middleware de autenticação para proteger as rotas
router.use(authMiddleware);

// Definir os handlers para cada método HTTP
router.post(postHandler);

// Handler principal da API
async function postHandler(request, response) {
  return response.status(410).json({
    error: "Endpoint obsoleto",
    message:
      "A criação de sessões agora é gerenciada diretamente pelos endpoints de agendamento.",
  });
}

// Exportar o handler com tratamento de erros
export default router.handler(controller.errorHandlers);
