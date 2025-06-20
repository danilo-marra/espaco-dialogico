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
        "Acesso negado. Apenas administradores podem acessar relatórios financeiros.",
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

// Handler para buscar resumo financeiro
async function getHandler(request, response) {
  try {
    const { periodo } = request.query;

    if (!periodo) {
      return response.status(400).json({
        error: "Período é obrigatório (formato: YYYY-MM)",
      });
    }

    // Validar formato do período
    if (!/^\d{4}-\d{2}$/.test(periodo)) {
      return response.status(400).json({
        error: "Formato de período inválido. Use YYYY-MM",
      });
    }

    const resumoFinanceiro = await transacao.getResumoFinanceiro(periodo);

    return response.status(200).json(resumoFinanceiro);
  } catch (error) {
    console.error("Erro ao buscar resumo financeiro:", error);

    if (error.message.includes("Período é obrigatório")) {
      return response.status(400).json({ error: error.message });
    }

    return response.status(500).json({
      error: "Erro interno do servidor ao buscar resumo financeiro",
    });
  }
}
