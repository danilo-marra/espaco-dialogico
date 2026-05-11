import { verifyToken } from "../../../../utils/auth.js";

export default async function handler(request, response) {
  // Verificar método
  if (request.method !== "GET") {
    return response.status(405).json({
      error: `Method "${request.method}" not allowed`,
      message: "Use GET",
    });
  }

  // Verificar autenticação e permissão de admin
  try {
    const token = request.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return response.status(401).json({
        error: "Token de acesso requerido",
      });
    }

    const user = verifyToken(token);
    if (!user || user.role !== "admin") {
      return response.status(403).json({
        error: "Acesso negado",
        message: "Apenas administradores podem testar configuração de email",
      });
    }
  } catch (error) {
    return response.status(401).json({
      error: "Token inválido",
    });
  }

  const isReady =
    !!process.env.EMAIL_SMTP_HOST &&
    !!process.env.EMAIL_SMTP_PORT &&
    !!process.env.EMAIL_HTTP_HOST &&
    !!process.env.EMAIL_HTTP_PORT;

  return response.status(isReady ? 200 : 500).json({
    success: isReady,
    message: isReady
      ? "Configuração SMTP nativa válida"
      : "Configuração SMTP incompleta",
    status: isReady ? "OK" : "ERROR",
    mailpitUrl: `http://${process.env.EMAIL_HTTP_HOST || "localhost"}:${process.env.EMAIL_HTTP_PORT || "8025"}`,
  });
}
