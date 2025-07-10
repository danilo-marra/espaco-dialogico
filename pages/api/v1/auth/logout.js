import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import authMiddleware from "utils/authMiddleware.js";
import userSession from "models/userSession.js";

const router = createRouter();

router.use(authMiddleware).post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  try {
    // O middleware de autenticação já validou a sessão.
    // Agora, precisamos invalidar o token de sessão.
    const authHeader = request.headers.authorization;
    const token = authHeader.split(" ")[1];

    // O token JWT contém o session ID, precisamos decodificá-lo sem verificar a expiração
    // para garantir que possamos fazer o logout mesmo que o JWT tenha expirado localmente.
    const jwt = require("jsonwebtoken");
    const decodedJwt = jwt.decode(token);

    if (!decodedJwt || !decodedJwt.sessionId) {
      return response.status(400).json({ error: "Token malformado." });
    }

    const success = await userSession.deleteByToken(decodedJwt.sessionId);

    if (success) {
      return response
        .status(200)
        .json({ message: "Logout realizado com sucesso." });
    } else {
      return response
        .status(404)
        .json({ error: "Sessão não encontrada para logout." });
    }
  } catch (error) {
    console.error("Erro no logout:", error);
    return response
      .status(500)
      .json({ error: "Erro interno ao tentar fazer logout." });
  }
}
