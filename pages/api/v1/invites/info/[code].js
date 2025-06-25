import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import invite from "models/invite.js";

const router = createRouter();

router.get(getHandler);

export default router.handler(controller.errorHandlers);

// Buscar informações básicas do convite pelo código (sem validar ou usar)
async function getHandler(request, response) {
  const { code } = request.query;

  if (!code) {
    return response.status(400).json({
      error: "Código de convite é obrigatório",
    });
  }

  try {
    const inviteData = await invite.getByCode(code);

    // Verificar se o convite já foi usado
    if (inviteData.used) {
      return response.status(400).json({
        error: "Este código de convite já foi utilizado",
        action: "Por favor, solicite um novo código ao administrador.",
      });
    }

    // Verificar se o convite expirou
    if (new Date(inviteData.expires_at) < new Date()) {
      return response.status(400).json({
        error: "Este código de convite expirou",
        action: "Por favor, solicite um novo código ao administrador.",
      });
    }

    // Retornar apenas as informações necessárias para o formulário
    return response.status(200).json({
      email: inviteData.email,
      role: inviteData.role,
      expires_at: inviteData.expires_at,
    });
  } catch (error) {
    if (error.name === "NotFoundError") {
      return response.status(404).json({
        error: "Código de convite não encontrado",
        action: "Verifique o código ou solicite um novo convite.",
      });
    }

    console.error("Erro ao buscar convite:", error);
    return response.status(500).json({
      error: "Erro interno do servidor",
    });
  }
}
