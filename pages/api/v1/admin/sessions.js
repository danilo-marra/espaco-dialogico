import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import authMiddleware from "utils/authMiddleware.js";
import { requirePermission } from "utils/roleMiddleware.js";
import userSession from "models/userSession.js";
import database from "infra/database.js";

const router = createRouter();

router.use(authMiddleware).use(requirePermission("usuarios"));
router.get(getHandler);
router.post(postHandler);

export default router.handler(controller.errorHandlers);

/**
 * Listar todas as sessões ativas (apenas para admins)
 */
async function getHandler(request, response) {
  try {
    const result = await database.query({
      text: `
        SELECT 
          us.id,
          us.user_id,
          us.created_at,
          us.expires_at,
          u.username,
          u.email,
          u.role,
          CASE 
            WHEN us.expires_at > NOW() THEN 'active'
            ELSE 'expired'
          END as status
        FROM user_sessions us
        JOIN users u ON us.user_id = u.id
        ORDER BY us.created_at DESC
      `,
    });

    return response.status(200).json({
      sessions: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error("Erro ao listar sessões:", error);
    return response.status(500).json({
      error: "Erro ao listar sessões",
    });
  }
}

/**
 * Forçar logout de usuário específico (apenas para admins)
 */
async function postHandler(request, response) {
  try {
    const { userId, action = "all" } = request.body;

    if (!userId) {
      return response.status(400).json({
        error: "userId é obrigatório",
      });
    }

    let sessionsRemoved;

    if (action === "all") {
      // Remover TODAS as sessões do usuário
      sessionsRemoved = await userSession.deleteAllByUserId(userId);
    }

    return response.status(200).json({
      message: `Logout forçado realizado para usuário ${userId}`,
      sessionsRemoved,
    });
  } catch (error) {
    console.error("Erro ao forçar logout:", error);
    return response.status(500).json({
      error: "Erro ao forçar logout",
    });
  }
}
