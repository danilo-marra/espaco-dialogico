import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import invite from "models/invite.js";
import authMiddleware from "utils/authMiddleware.js";

const router = createRouter();

// Aplicar o middleware de autenticação a todas as rotas
router.use(authMiddleware);
router.get(getHandler);
router.post(postHandler);

export default router.handler(controller.errorHandlers);

// Listar todos os convites
async function getHandler(request, response) {
  // Verificar se o usuário é um administrador
  if (request.user.role !== "admin") {
    return response.status(403).json({
      error: "Acesso negado",
      action: "Apenas administradores podem listar convites",
    });
  }

  try {
    const invites = await invite.getAll();
    return response.status(200).json(invites);
  } catch (error) {
    console.error("Erro ao buscar convites:", error);
    return response.status(500).json({ error: "Erro ao buscar convites" });
  }
}

// Criar um novo convite
async function postHandler(request, response) {
  // Verificar se o usuário é um administrador
  if (request.user.role !== "admin") {
    return response.status(403).json({
      error: "Acesso negado",
      action: "Apenas administradores podem criar convites",
    });
  }

  const { email, role, expiresInDays } = request.body;

  try {
    const newInvite = await invite.create({
      email,
      role: role || "user",
      expiresInDays: parseInt(expiresInDays, 10) || 7,
      createdBy: request.user.id,
    });

    return response.status(201).json(newInvite);
  } catch (error) {
    console.error("Erro ao criar convite:", error);
    return response.status(500).json({ error: "Erro ao criar convite" });
  }
}
