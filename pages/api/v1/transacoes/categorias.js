import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import transacao from "models/transacao.js";
import authMiddleware from "utils/authMiddleware.js";

// Criar o router
const router = createRouter();

// Aplicar middleware de autenticação para proteger as rotas
router.use(authMiddleware);

// Middleware para verificar se o usuário é admin
function adminMiddleware(request, response, next) {
  if (request.user.role !== "admin") {
    return response.status(403).json({
      error:
        "Acesso negado. Apenas administradores podem acessar esta informação.",
    });
  }
  next();
}

// Aplicar middleware de admin
router.use(adminMiddleware);

// Definir os handlers para cada método HTTP
router.get(getHandler);

// Exportar o handler com tratamento de erros
export default router.handler(controller.errorHandlers);

// Handler para buscar categorias de transações
async function getHandler(request, response) {
  try {
    const categorias = await transacao.getCategorias();

    return response.status(200).json({
      categorias: categorias,
      total: categorias.length,
    });
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);

    return response.status(500).json({
      error: "Erro interno do servidor ao buscar categorias",
    });
  }
}
