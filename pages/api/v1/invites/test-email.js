import { verifyToken } from "../../../../utils/auth.js";
import email from "../../../../infra/email";

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

  const provider = email.getEmailProvider();

  const environmentInfo = {
    EMAIL_PROVIDER: process.env.EMAIL_PROVIDER || "auto",
    ACTIVE_PROVIDER: provider,
    RESEND_API_KEY: process.env.RESEND_API_KEY
      ? "✅ Definida"
      : "❌ Não definida",
    EMAIL_FROM_ADDRESS: process.env.EMAIL_FROM_ADDRESS
      ? "✅ Definida"
      : "⚠️ Recomendada",
    EMAIL_SMTP_HOST: process.env.EMAIL_SMTP_HOST
      ? "✅ Definida"
      : "❌ Não definida",
    EMAIL_SMTP_PORT: process.env.EMAIL_SMTP_PORT
      ? "✅ Definida"
      : "❌ Não definida",
    EMAIL_SMTP_USER: process.env.EMAIL_SMTP_USER
      ? "✅ Definida"
      : "⚠️ Opcional",
    EMAIL_SMTP_PASSWORD: process.env.EMAIL_SMTP_PASSWORD
      ? "✅ Definida"
      : "⚠️ Opcional",
    EMAIL_HTTP_HOST: process.env.EMAIL_HTTP_HOST
      ? "✅ Definida"
      : "❌ Não definida",
    EMAIL_HTTP_PORT: process.env.EMAIL_HTTP_PORT
      ? "✅ Definida"
      : "❌ Não definida",
    NODE_ENV: process.env.NODE_ENV,
  };

  const smtpReady =
    !!process.env.EMAIL_SMTP_HOST && !!process.env.EMAIL_SMTP_PORT;

  const resendReady = !!process.env.RESEND_API_KEY;

  const isReady = provider === "resend" ? resendReady : smtpReady;

  const providerMessage =
    provider === "resend"
      ? "Configuração Resend válida"
      : "Configuração SMTP nativa válida";

  const fallbackMessage =
    provider === "resend"
      ? "Configuração Resend incompleta"
      : "Configuração SMTP incompleta";

  return response.status(isReady ? 200 : 500).json({
    success: isReady,
    message: isReady ? providerMessage : fallbackMessage,
    provider,
    environmentInfo,
    ...(provider === "smtp" &&
      process.env.EMAIL_HTTP_HOST && {
        mailpitUrl: `http://${process.env.EMAIL_HTTP_HOST}:${process.env.EMAIL_HTTP_PORT || "8025"}`,
      }),
  });
}
