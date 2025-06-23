import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user.js";
import { requirePermission } from "utils/roleMiddleware.js";

const router = createRouter();

// Aplicar middleware de autenticação e autorização
router.use(requirePermission("usuarios"));
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
