import { verifyToken } from "./auth.js";

export default function authMiddleware(handler) {
  return async (req, res) => {
    try {
      // Verificar se o token está presente no cabeçalho
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res
          .status(401)
          .json({ error: "Token de autenticação não fornecido" });
      }

      // Extrair e verificar o token
      const token = authHeader.split(" ")[1];
      const decoded = verifyToken(token);

      if (!decoded) {
        return res.status(401).json({ error: "Token inválido ou expirado" });
      }

      // Adicionar usuário decodificado à solicitação
      req.user = decoded;

      // Prosseguir com o manipulador da rota original
      return handler(req, res);
    } catch (error) {
      return res.status(401).json({ error: "Falha na autenticação" });
    }
  };
}
