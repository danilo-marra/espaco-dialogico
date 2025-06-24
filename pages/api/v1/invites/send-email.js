import { sendInviteEmail } from "../../../../utils/emailService.js";
import { verifyToken } from "../../../../utils/auth.js";
import database from "../../../../infra/database";

export default async function handler(request, response) {
  // Verificar método
  if (request.method !== "POST") {
    return response.status(405).json({
      error: `Method "${request.method}" not allowed`,
      message: "Use POST",
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
        message: "Apenas administradores podem enviar emails",
      });
    }
  } catch (error) {
    return response.status(401).json({
      error: "Token inválido",
    });
  } // Processar envio de email
  try {
    const { inviteId } = request.body;

    if (!inviteId) {
      return response.status(400).json({
        error: "inviteId é obrigatório",
        message: "Informe o ID do convite para enviar o email",
      });
    }

    // Buscar dados do convite
    const inviteQuery = {
      text: `
        SELECT 
          i.id,
          i.code,
          i.email,
          i.role,
          i.expires_at,
          i.used,
          i.created_by,
          u.username as created_by_username
        FROM invites i
        LEFT JOIN users u ON i.created_by = u.id
        WHERE i.id = $1
      `,
      values: [inviteId],
    };

    const inviteResult = await database.query(inviteQuery);
    if (inviteResult.rows.length === 0) {
      return response.status(404).json({
        error: "Convite não encontrado",
        message: "Não foi possível encontrar o convite com o ID especificado",
      });
    }

    const inviteData = inviteResult.rows[0];

    // Validações
    if (!inviteData.email) {
      return response.status(400).json({
        error: "Convite sem email",
        message: "Este convite não possui um email associado",
      });
    }

    if (inviteData.used) {
      return response.status(400).json({
        error: "Convite já utilizado",
        message: "Não é possível enviar email para convite já utilizado",
      });
    }

    if (new Date(inviteData.expires_at) < new Date()) {
      return response.status(400).json({
        error: "Convite expirado",
        message: "Não é possível enviar email para convite expirado",
      });
    } // Preparar dados para envio
    const emailData = {
      email: inviteData.email,
      code: inviteData.code,
      role: inviteData.role,
      expires_at: inviteData.expires_at,
    };

    const senderName = inviteData.created_by_username || "Sistema";

    // Enviar email
    const emailResult = await sendInviteEmail(emailData, senderName);

    if (!emailResult.success) {
      return response.status(500).json({
        error: "Falha no envio do email",
        message: emailResult.message || "Não foi possível enviar o email",
        details: emailResult.error,
      });
    } // Atualizar registro com informações de envio
    const updateQuery = {
      text: `
        UPDATE invites 
        SET last_email_sent = $1
        WHERE id = $2
      `,
      values: [new Date().toISOString(), inviteId],
    };

    await database.query(updateQuery);

    const successResponse = {
      success: true,
      message: "Email enviado com sucesso",
      data: {
        inviteId: inviteData.id,
        email: inviteData.email,
        messageId: emailResult.messageId,
        sentAt: new Date().toISOString(),
      },
    };

    return response.status(200).json(successResponse);
  } catch (error) {
    console.error("❌ Erro detalhado no envio de email:", error);
    console.error("📋 Stack trace:", error.stack);
    console.error("🔧 Variáveis de ambiente disponíveis:", {
      EMAIL_USER: process.env.EMAIL_USER ? "✅ Definida" : "❌ Não definida",
      EMAIL_PASSWORD: process.env.EMAIL_PASSWORD
        ? "✅ Definida"
        : "❌ Não definida",
      NODE_ENV: process.env.NODE_ENV,
    });

    return response.status(500).json({
      error: "Erro interno do servidor",
      message: "Ocorreu um erro ao processar a solicitação",
      details:
        process.env.NODE_ENV === "development"
          ? {
              error: error.message,
              stack: error.stack,
            }
          : "Detalhes não disponíveis em produção",
    });
  }
}
