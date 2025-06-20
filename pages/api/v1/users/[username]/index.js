import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user.js";
import authMiddleware from "utils/authMiddleware.js";

const router = createRouter();

// Aplicar middleware de autenticação para rotas que precisam de proteção
router.get(getHandler);
router.use(authMiddleware); // Proteger PUT e DELETE
router.put(putHandler);
router.delete(deleteHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const username = request.query.username;
  const userFound = await user.findOneByUsername(username);

  if (!userFound) {
    return response.status(404).json({ error: "Usuário não encontrado" });
  }

  const userWithoutPassword = { ...userFound };
  delete userWithoutPassword.password;
  return response.status(200).json(userWithoutPassword);
}

async function putHandler(request, response) {
  const username = request.query.username;
  const updateData = request.body;
  const loggedUser = request.user;

  try {
    // Verificar se o usuário autenticado pode atualizar este perfil
    // Apenas o próprio usuário ou um admin pode atualizar
    if (loggedUser.username !== username && loggedUser.role !== "admin") {
      return response.status(403).json({
        error: "Acesso negado",
        message: "Você só pode atualizar seu próprio perfil",
      });
    }

    // Verificar se o usuário existe
    const userExists = await user.findOneByUsername(username);
    if (!userExists) {
      return response.status(404).json({ error: "Usuário não encontrado" });
    }

    // Se não for admin, remover campos que usuários comuns não podem alterar
    if (loggedUser.role !== "admin") {
      delete updateData.role;
    }

    // Atualizar usuário
    const updatedUser = await user.update(username, updateData);

    // Remover senha do retorno
    const { password: _, ...userWithoutPassword } = updatedUser;
    return response.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);

    if (error.name === "ValidationError") {
      return response.status(400).json(error);
    }
    if (error.name === "NotFoundError") {
      return response.status(404).json(error);
    }

    return response.status(500).json({ error: "Erro ao atualizar usuário" });
  }
}

async function deleteHandler(request, response) {
  const username = request.query.username;
  const loggedUser = request.user;

  try {
    // Verificar se o usuário autenticado pode deletar este perfil
    // Apenas o próprio usuário ou um admin pode deletar
    if (loggedUser.username !== username && loggedUser.role !== "admin") {
      return response.status(403).json({
        error: "Acesso negado",
        message: "Você só pode deletar seu próprio perfil",
      });
    }

    // Verificar se o usuário existe
    const userExists = await user.findOneByUsername(username);
    if (!userExists) {
      return response.status(404).json({ error: "Usuário não encontrado" });
    }

    // Não permitir que usuários deletem contas de admin (exceto se for outro admin)
    if (userExists.role === "admin" && loggedUser.role !== "admin") {
      return response.status(403).json({
        error: "Acesso negado",
        message: "Não é possível deletar conta de administrador",
      });
    }

    // Não permitir que um admin delete sua própria conta
    if (loggedUser.username === username && loggedUser.role === "admin") {
      return response.status(400).json({
        error: "Operação não permitida",
        message: "Administradores não podem deletar suas próprias contas",
      });
    }

    // Deletar usuário
    await user.delete(username);
    return response.status(200).json({
      message: "Usuário deletado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao deletar usuário:", error);

    if (error.name === "NotFoundError") {
      return response.status(404).json(error);
    }

    return response.status(500).json({ error: "Erro ao deletar usuário" });
  }
}
