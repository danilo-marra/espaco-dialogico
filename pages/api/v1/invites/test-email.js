// API para testar a configuração de email
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
        message: "Apenas administradores podem testar a configuração de email",
      });
    }
  } catch (error) {
    return response.status(401).json({
      error: "Token inválido",
    });
  }

  // Testar configuração de email
  try {
    console.log("🧪 Testando configuração de email...");

    const testResult = await testEmailConfiguration();

    console.log("📊 Resultado do teste:", testResult);

    return response.status(200).json({
      success: true,
      message: "Teste de configuração concluído",
      result: testResult,
      environmentInfo: {
        EMAIL_USER: process.env.EMAIL_USER ? "✅ Definida" : "❌ Não definida",
        EMAIL_PASSWORD: process.env.EMAIL_PASSWORD
          ? "✅ Definida"
          : "❌ Não definida",
        NODE_ENV: process.env.NODE_ENV,
      },
    });
  } catch (error) {
    console.error("❌ Erro no teste de email:", error);

    return response.status(500).json({
      error: "Erro ao testar configuração",
      message: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}
