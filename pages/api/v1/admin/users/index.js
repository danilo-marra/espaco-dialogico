import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user.js";
import authMiddleware from "utils/authMiddleware.js";

const router = createRouter();

// Aplicar middleware de autenticação
router.use(authMiddleware);
router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  try {
    const loggedUser = request.user;

    if (!loggedUser) {
      return response.status(401).json({
        error: "Usuário não autenticado",
      });
    }

    // Verificar se o usuário é administrador
    if (loggedUser.role !== "admin") {
      return response.status(403).json({
        error: "Acesso restrito a administradores",
      });
    }

    // Buscar todos os usuários
    const users = await user.getAll();

    // Remover as senhas dos usuários antes de enviar
    const usersWithoutPasswords = users.map((user) => {
      // Usando o operador rest para excluir a propriedade password
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return response.status(200).json(usersWithoutPasswords);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return response.status(500).json({
      error: "Erro ao buscar usuários",
      details: error.message,
    });
  }
}
