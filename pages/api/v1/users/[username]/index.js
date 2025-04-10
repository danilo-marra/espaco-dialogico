import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user.js";

const router = createRouter();

router.get(getHandler);
router.put(putHandler);
router.delete(deleteHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const username = request.query.username;
  const userFound = await user.findOneByUsername(username);

  if (!userFound) {
    return response.status(404).json({ error: "Usuário não encontrado" });
  }

  return response.status(200).json(userFound);
}

async function putHandler(request, response) {
  const username = request.query.username;
  const updateData = request.body;

  try {
    // Verificar se o usuário existe
    const userExists = await user.findOneByUsername(username);
    if (!userExists) {
      return response.status(404).json({ error: "Usuário não encontrado" });
    }

    // Atualizar usuário
    const updatedUser = await user.update(username, updateData);
    return response.status(200).json(updatedUser);
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return response.status(500).json({ error: "Erro ao atualizar usuário" });
  }
}

async function deleteHandler(request, response) {
  const username = request.query.username;

  try {
    // Verificar se o usuário existe
    const userExists = await user.findOneByUsername(username);
    if (!userExists) {
      return response.status(404).json({ error: "Usuário não encontrado" });
    }

    // Deletar usuário
    await user.delete(username);
    return response.status(204).send(); // 204 No Content - resposta bem-sucedida sem conteúdo
  } catch (error) {
    console.error("Erro ao deletar usuário:", error);
    return response.status(500).json({ error: "Erro ao deletar usuário" });
  }
}
