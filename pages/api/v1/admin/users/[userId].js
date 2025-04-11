import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user.js";
import { hashPassword } from "utils/auth.js";
import authMiddleware from "utils/authMiddleware.js";

const router = createRouter();

// Aplicar middleware de autenticação
router.use(authMiddleware);
router.put(putHandler);
router.delete(deleteHandler);

export default router.handler(controller.errorHandlers);

async function putHandler(request, response) {
  try {
    // 1. Verificação de permissões
    const loggedUser = request.user;
    if (loggedUser.role !== "admin") {
      return response.status(403).json({
        error: "Acesso restrito a administradores",
      });
    }

    // 2. Extrair dados da requisição
    const userId = parseInt(request.query.userId, 10);
    const { email, newUsername, password, role } = request.body;

    // 3. Verificar se tem campos para atualizar
    const updateData = {};
    if (email) updateData.email = email;
    if (newUsername) updateData.username = newUsername;
    if (role) updateData.role = role;

    if (Object.keys(updateData).length === 0 && !password) {
      return response.status(400).json({
        error: "Nenhum campo fornecido para atualização",
      });
    }

    // 4. Validar senha se fornecida
    if (password) {
      if (password.length < 8) {
        return response.status(400).json({
          error: "A senha deve ter pelo menos 8 caracteres",
        });
      }
      updateData.password = await hashPassword(password);
    }

    // 5. Tentar encontrar o usuário (apenas para verificar se existe)
    try {
      await user.findById(userId);
    } catch (error) {
      if (error.name === "NotFoundError") {
        return response.status(400).json(error);
      }
      throw error;
    }

    // 6. Atualizar o usuário
    try {
      const updatedUser = await user.update(userId, updateData);
      const { password: _, ...userWithoutPassword } = updatedUser;

      return response.status(200).json({
        message: "Usuário atualizado com sucesso",
        user: userWithoutPassword,
      });
    } catch (error) {
      if (error.name === "ValidationError") {
        return response.status(400).json(error);
      }
      if (error.name === "NotFoundError") {
        return response.status(400).json(error);
      }
      throw error;
    }
  } catch (error) {
    console.error("Erro não tratado ao atualizar usuário:", error);
    // Adicionar informações de diagnóstico para debug
    return response.status(500).json({
      error: "Erro ao atualizar usuário",
      message: error.message,
      stack: process.env.NODE_ENV !== "production" ? error.stack : undefined,
    });
  }
}

async function deleteHandler(request, response) {
  const loggedUser = request.user;
  const { userId } = request.query;

  // Verificar se o usuário é administrador
  if (loggedUser.role !== "admin") {
    return response.status(403).json({
      error: "Acesso restrito a administradores",
    });
  }

  try {
    // Buscar usuário pelo ID antes de excluir
    let targetUser;

    try {
      targetUser = await user.findById(parseInt(userId));
    } catch (error) {
      if (error.name === "NotFoundError") {
        return response.status(404).json(error);
      }
      throw error; // Re-lançar outros erros
    }

    // Não permitir que o administrador exclua a si mesmo
    if (
      targetUser.username.toLowerCase() === loggedUser.username.toLowerCase()
    ) {
      return response.status(400).json({
        error: "Você não pode excluir sua própria conta",
      });
    }

    await user.delete(parseInt(userId));

    return response.status(200).json({
      message: "Usuário excluído com sucesso",
    });
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);

    if (error.name === "NotFoundError") {
      return response.status(404).json(error);
    }

    return response.status(500).json({
      error: "Erro ao excluir usuário",
      details: error.message,
    });
  }
}
