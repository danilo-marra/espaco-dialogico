import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import authMiddleware from "utils/authMiddleware.js";
import userSession from "models/userSession.js";

const router = createRouter();

router.use(authMiddleware);
router.post(postHandler);

export default router.handler(controller.errorHandlers);

/**
 * Endpoint para logout de TODAS as sessões do usuário atual
 * Útil para casos como "Sair de todos os dispositivos"
 */
async function postHandler(request, response) {
  try {
    const userId = request.user.id;

    // Remover TODAS as sessões do usuário
    const sessionsRemoved = await userSession.deleteAllByUserId(userId);

    return response.status(200).json({
      message: "Logout realizado em todos os dispositivos",
      sessionsRemoved,
    });
  } catch (error) {
    console.error("Erro ao realizar logout completo:", error);
    return response.status(500).json({
      error: "Erro ao realizar logout completo",
    });
  }
}
