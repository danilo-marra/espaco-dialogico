import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user.js";
import { verifyPassword, generateToken } from "utils/auth.js";

const router = createRouter();

router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const { username, password } = request.body;

  // Validação básica dos campos obrigatórios
  if (!username || !password) {
    return response.status(400).json({
      error: "Username e senha são obrigatórios",
    });
  }

  try {
    // Buscar usuário pelo username
    const userFound = await user.findOneByUsername(username).catch(() => null);

    if (!userFound) {
      return response.status(401).json({
        error: "Credenciais inválidas",
      });
    }

    // Verificar senha
    const isPasswordValid = await verifyPassword(password, userFound.password);

    if (!isPasswordValid) {
      return response.status(401).json({
        error: "Credenciais inválidas",
      });
    }

    // Gerar token JWT
    const token = generateToken(userFound);

    // Remover a senha do objeto de resposta
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
