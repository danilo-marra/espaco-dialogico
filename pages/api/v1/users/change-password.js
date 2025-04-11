import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user.js";
import { hashPassword, verifyPassword } from "utils/auth.js";
import authMiddleware from "utils/authMiddleware.js";

const router = createRouter();

// Aplicar middleware de autenticação a todas as rotas
router.use(authMiddleware);
router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  try {
    const { currentPassword, newPassword } = request.body;
    const loggedUser = request.user;

    if (!loggedUser) {
      return response.status(401).json({
        error: "Usuário não autenticado",
      });
    }

    // Validação básica
    if (!currentPassword || !newPassword) {
      return response.status(400).json({
        error: "Senha atual e nova senha são obrigatórias",
      });
    }

    if (newPassword.length < 8) {
      return response.status(400).json({
        error: "A nova senha deve ter pelo menos 8 caracteres",
      });
    }

    // Buscar usuário atual para verificar a senha
    let userFound;
    try {
      userFound = await user.findOneByUsername(loggedUser.username);
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      return response.status(404).json({
        error: "Usuário não encontrado",
      });
    }

    // Verificar se a senha atual está correta
    const isPasswordValid = await verifyPassword(
      currentPassword,
      userFound.password,
    );

    if (!isPasswordValid) {
      return response.status(401).json({
        error: "Senha atual incorreta",
      });
    }

    // Hash da nova senha
    const hashedPassword = await hashPassword(newPassword);

    // Atualizar a senha do usuário
    await user.update(loggedUser.username, { password: hashedPassword });

    return response.status(200).json({
      message: "Senha alterada com sucesso",
    });
  } catch (error) {
    console.error("Erro ao alterar senha:", error);
    return response.status(500).json({
      error: "Erro ao alterar senha",
      details: error.message,
    });
  }
}
