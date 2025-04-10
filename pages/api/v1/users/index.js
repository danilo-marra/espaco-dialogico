import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user.js";

const router = createRouter();

router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const userInputValues = request.body;

  // Validação básica dos campos obrigatórios - ajustado para corresponder aos testes
  const requiredFields = ["username", "email", "password"];

  for (const field of requiredFields) {
    if (!userInputValues[field]) {
      return response.status(400).json({
        error: `O campo "${field}" é obrigatório`,
      });
    }
  }

  try {
    const newUser = await user.create(userInputValues);
    return response.status(201).json(newUser);
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    // Passar os erros de validação diretamente para o cliente
    if (error.name === "ValidationError") {
      return response.status(400).json(error);
    }
    return response.status(500).json({ error: "Erro ao criar usuário" });
  }
}
