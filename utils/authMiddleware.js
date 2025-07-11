import { verifyToken } from "./auth.js";
import userSession from "models/userSession.js";
import user from "models/user.js";

async function authenticate(request) {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Token de autenticação não fornecido");
  }

  const token = authHeader.split(" ")[1];
  const decodedJwt = verifyToken(token);

  if (
    !decodedJwt ||
    !decodedJwt.sessionId ||
    !decodedJwt.userId ||
    decodedJwt.tokenVersion === undefined
  ) {
    throw new Error("Token inválido ou malformado");
  }

  const session = await userSession.findByToken(decodedJwt.sessionId);

  if (!session || session.user_id !== decodedJwt.userId) {
    const err = new Error("Sessão inválida. Por favor, faça login novamente.");
    err.statusCode = 401;
    throw err;
  }

  const userFound = await user.findById(session.user_id);

  if (!userFound) {
    throw new Error("Usuário da sessão não encontrado");
  }

  // Verificar a versão do token
  if (userFound.token_version !== decodedJwt.tokenVersion) {
    const err = new Error("Sessão inválida. Por favor, faça login novamente.");
    err.statusCode = 401;
    throw err;
  }

  delete userFound.password;
  return userFound;
}

// Versão para next-connect v1
export default async function authMiddleware(request, response, next) {
  try {
    const userFound = await authenticate(request);
    request.user = userFound;
    return next();
  } catch (error) {
    return response.status(401).json({ error: error.message });
  }
}

// Versão para handlers de API padrão
export function withAuthMiddleware(handler) {
  return async (req, res) => {
    try {
      const userFound = await authenticate(req);
      req.user = userFound;
      return handler(req, res);
    } catch (error) {
      return res.status(401).json({ error: error.message });
    }
  };
}
