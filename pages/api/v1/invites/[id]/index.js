import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import invite from "models/invite.js";
import authMiddleware from "utils/authMiddleware.js";

const router = createRouter();

// Apenas usuários autenticados podem deletar convites
router.delete(authMiddleware(deleteHandler));

export default router.handler(controller.errorHandlers);

async function deleteHandler(request, response) {
  // Verificar se o usuário é um administrador
  if (request.user.role !== "admin") {
    return response.status(403).json({
      error: "Acesso negado",
      action: "Apenas administradores podem excluir convites",
    });
  }

  const id = request.query.id;

  try {
    await invite.deleteById(id);
    return response.status(204).end();
  } catch (error) {
    console.error("Erro ao excluir convite:", error);

    if (error.name === "NotFoundError") {
      return response.status(404).json(error);
    }

    return response.status(500).json({ error: "Erro ao excluir convite" });
  }
}
