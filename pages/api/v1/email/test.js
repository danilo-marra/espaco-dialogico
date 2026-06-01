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
        message: "Apenas administradores podem testar configuração de email",
      });
    }
  } catch (error) {
    return response.status(401).json({
      error: "Token inválido",
    });
  }

  const provider = email.getEmailProvider();

  const smtpReady =
    !!process.env.EMAIL_SMTP_HOST && !!process.env.EMAIL_SMTP_PORT;

  const resendReady = !!process.env.RESEND_API_KEY;

  const isReady = provider === "resend" ? resendReady : smtpReady;

  const message = isReady
    ? provider === "resend"
      ? "Configuração Resend válida"
      : "Configuração SMTP nativa válida"
    : provider === "resend"
      ? "Configuração Resend incompleta"
      : "Configuração SMTP incompleta";

  return response.status(isReady ? 200 : 500).json({
    success: isReady,
    message,
    provider,
    status: isReady ? "OK" : "ERROR",
    ...(provider === "smtp" &&
      isReady &&
      process.env.EMAIL_HTTP_HOST &&
      process.env.EMAIL_HTTP_PORT && {
        mailpitUrl: `http://${process.env.EMAIL_HTTP_HOST}:${process.env.EMAIL_HTTP_PORT}`,
      }),
  });
}
