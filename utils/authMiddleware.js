import { verifyToken } from "./auth.js";

// Versão adaptada para next-connect v1
export default async function authMiddleware(request, response, next) {
  try {
    // Verificar se o token está presente no cabeçalho
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return response
        .status(401)
        .json({ error: "Token de autenticação não fornecido" });
    }

    // Extrair e verificar o token
    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return response.status(401).json({ error: "Token inválido ou expirado" });
    }

    // Adicionar usuário decodificado à solicitação
    request.user = decoded;

    // Prosseguir com o próximo middleware ou handler
    return next();
  } catch (error) {
    console.error("Erro de autenticação:", error);
    return response.status(401).json({ error: "Falha na autenticação" });
  }
}

/**
 * Função para envolver um handler de API com o middleware de autenticação
 * @param {Function} handler - Handler da API que será protegido
 * @returns {Function} Handler com autenticação
 */
export function withAuthMiddleware(handler) {
  return async (req, res) => {
    try {
      // Verificar se o token está presente no cabeçalho
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          error: "Não autorizado",
          message: "Token de autenticação não fornecido",
        });
      }

      // Extrair e verificar o token
      const token = authHeader.split(" ")[1];
      const decoded = verifyToken(token);

      if (!decoded) {
        return res.status(401).json({
          error: "Não autorizado",
          message: "Token inválido ou expirado",
        });
      }

      // Adicionar usuário decodificado à solicitação
      req.user = decoded;

      // Prosseguir para o handler
      return handler(req, res);
    } catch (error) {
      console.error("Erro de autenticação:", error);
      return res.status(401).json({
        error: "Falha na autenticação",
        message: error.message,
      });
    }
  };
}
