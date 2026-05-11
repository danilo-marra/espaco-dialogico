import email from "../../../../infra/email";
import database from "../../../../infra/database";
import {
  createInviteEmailTemplate,
  createInviteEmailText,
} from "../../../../utils/emailTemplates/inviteTemplate.js";
import { withAuthMiddleware } from "../../../../utils/authMiddleware.js";
import { withRolePermission } from "../../../../utils/roleMiddleware.js";

async function handler(request, response) {
  // Verificar método
  if (request.method !== "POST") {
    return response.status(405).json({
      error: `Method "${request.method}" not allowed`,
      message: "Use POST",
    });
  }

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
    const senderName = inviteData.created_by_username || "Sistema";

    const senderAddress =
      process.env.EMAIL_FROM_ADDRESS ||
      process.env.EMAIL_SMTP_USER ||
      "no-reply@espacodialogico.local";

    const mailOptions = {
      from: `Espaco Dialogico - Sistema <${senderAddress}>`,
      to: inviteData.email,
      subject: `Convite para o Espaco Dialogico - ${inviteData.code}`,
      html: createInviteEmailTemplate(
        inviteData.code,
        senderName,
        inviteData.expires_at,
        inviteData.role,
      ),
      text: createInviteEmailText(
        inviteData.code,
        senderName,
        inviteData.expires_at,
        inviteData.role,
      ),
    };

    await email.send(mailOptions);

    // Atualizar registro com informações de envio
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
        sentAt: new Date().toISOString(),
      },
    };

    return response.status(200).json(successResponse);
  } catch (error) {
    console.error("❌ Erro detalhado no envio de email:", error);
    console.error("📋 Stack trace:", error.stack);

    const isServiceError = error?.name === "ServiceError";

    return response.status(isServiceError ? 503 : 500).json({
      error: "Erro interno do servidor",
      message: isServiceError
        ? "Falha no serviço de email"
        : "Ocorreu um erro ao processar a solicitação",
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

export default withAuthMiddleware(withRolePermission(handler, "convites"));
