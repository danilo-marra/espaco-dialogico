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
  const loggedUser = request.user;
  const { username } = request.query;
  const { email, newUsername, password, role } = request.body;

  // Verificar se o usuário é administrador
  if (loggedUser.role !== "admin") {
    return response.status(403).json({
      error: "Acesso restrito a administradores",
    });
  }

  try {
    // Preparar objeto com os campos a serem atualizados
    const updateData = {};

    if (email) updateData.email = email;
    if (newUsername) updateData.username = newUsername;
    if (role) updateData.role = role;

    // Se foi fornecida uma senha, hash e adiciona ao updateData
    if (password) {
      if (password.length < 8) {
        return response.status(400).json({
          error: "A senha deve ter pelo menos 8 caracteres",
        });
      }
      updateData.password = await hashPassword(password);
    }

    // Verificar se há campos para atualizar
    if (Object.keys(updateData).length === 0) {
      return response.status(400).json({
        error: "Nenhum campo fornecido para atualização",
      });
    }

    // Atualizar o usuário
    const updatedUser = await user.update(username, updateData);

    // Remover a senha do objeto retornado
    // Usando underscore como prefixo para indicar que é deliberadamente não utilizada
    const { password: _password, ...userWithoutPassword } = updatedUser;

    return response.status(200).json({
      message: "Usuário atualizado com sucesso",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);

    if (error.name === "ValidationError" || error.name === "NotFoundError") {
      return response.status(400).json(error);
    }

    return response.status(500).json({
      error: "Erro ao atualizar usuário",
      details: error.message,
    });
  }
}

async function deleteHandler(request, response) {
  const loggedUser = request.user;
  const { username } = request.query;

  // Verificar se o usuário é administrador
  if (loggedUser.role !== "admin") {
    return response.status(403).json({
      error: "Acesso restrito a administradores",
    });
  }

  // Não permitir que o administrador exclua a si mesmo
  if (username.toLowerCase() === loggedUser.username.toLowerCase()) {
    return response.status(400).json({
      error: "Você não pode excluir sua própria conta",
    });
  }

  try {
    await user.delete(username);

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
