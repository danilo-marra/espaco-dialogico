import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user.js";
import userSession from "models/userSession.js";
import { verifyPassword, generateToken } from "utils/auth.js";

const router = createRouter();

router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const { email, password } = request.body;

  if (!email || !password) {
    return response.status(400).json({
      error: "Email e senha são obrigatórios",
    });
  }

  try {
    const userFound = await user.findOneByEmail(email).catch(() => null);

    if (!userFound) {
      return response.status(401).json({
        error: "Credenciais inválidas",
      });
    }

    const isPasswordValid = await verifyPassword(password, userFound.password);

    if (!isPasswordValid) {
      return response.status(401).json({
        error: "Credenciais inválidas",
      });
    }

    // IMPLEMENTAÇÃO: UMA SESSÃO POR USUÁRIO
    // Invalidar todas as sessões anteriores do usuário antes de criar uma nova
    await userSession.deleteAllByUserId(userFound.id);

    // Incrementar a versão do token do usuário
    const newTokenVersion = await user.incrementTokenVersion(userFound.id);

    // Criar uma nova sessão de usuário no banco de dados
    const newSession = await userSession.create(userFound.id);

    // Gerar um JWT que contém o token da sessão, o ID do usuário e a versão do token
    const token = generateToken({
      sessionId: newSession.token,
      userId: userFound.id,
      tokenVersion: newTokenVersion,
    });

    const userWithoutPassword = { ...userFound };
    delete userWithoutPassword.password;

    return response.status(200).json({
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error("Erro ao autenticar usuário:", error);
    return response.status(500).json({ error: "Erro ao autenticar usuário" });
  }
}
