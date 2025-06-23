import { testEmailConfiguration } from "../../../../utils/emailService.js";
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

  // Testar configuração de email
  try {
    const result = await testEmailConfiguration();

    if (result.success) {
      return response.status(200).json({
        success: true,
        message: "Configuração de email válida",
        status: "OK",
      });
    } else {
      return response.status(500).json({
        success: false,
        message: "Erro na configuração de email",
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Erro ao testar configuração de email:", error);
    return response.status(500).json({
      success: false,
      error: "Erro interno do servidor",
      message: "Falha ao verificar configuração de email",
    });
  }
}
