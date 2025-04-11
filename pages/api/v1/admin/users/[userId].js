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

// Função para validar se uma string é um UUID válido
function isValidUUID(str) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

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
    const userId = request.query.userId;
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

    // 5. Verificar se o userId é um UUID válido ou um username
    let userFound;
    try {
      if (isValidUUID(userId)) {
        // Se for um UUID válido, usa findById
        userFound = await user.findById(userId);
      } else {
        // Se não for um UUID, assume que é um username
        userFound = await user.findOneByUsername(userId);
      }
    } catch (error) {
      if (error.name === "NotFoundError") {
        return response.status(400).json(error);
      }
      throw error;
    }

    // 6. Atualizar o usuário usando o username encontrado
    try {
      const updatedUser = await user.update(userFound.username, updateData);
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
  const userId = request.query.userId;

  // Verificar se o usuário é administrador
  if (loggedUser.role !== "admin") {
    return response.status(403).json({
      error: "Acesso restrito a administradores",
    });
  }

  try {
    // Verificar se o userId é um UUID válido ou um username
    let targetUser;
    try {
      if (isValidUUID(userId)) {
        // Se for um UUID válido, usa findById
        targetUser = await user.findById(userId);
      } else {
        // Se não for um UUID, assume que é um username
        targetUser = await user.findOneByUsername(userId);
      }
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

    await user.delete(targetUser.username);

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
