import nodemailer from "nodemailer";
import { generateInviteLink } from "./getBaseUrl.js";

// Configuração do transportador de email com melhorias anti-spam
function createEmailTransporter() {
  console.log("🔧 Configurando transportador de email...");

  // Verificar variáveis de ambiente
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error(
      "❌ Variáveis de ambiente EMAIL_USER ou EMAIL_PASSWORD não definidas",
    );
    throw new Error("Configuração de email incompleta");
  }

  console.log("✅ Variáveis de ambiente encontradas:", {
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD
      ? "[DEFINIDA]"
      : "[NÃO DEFINIDA]",
  });

  // Configuração para Gmail com configurações anti-spam
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    // Configurações para melhorar deliverability
    pool: true,
    maxConnections: 5,
    maxMessages: 10,
    rateLimit: 5, // máximo 5 emails por segundo
    // Headers padrão para evitar spam
    headers: {
      "X-Priority": "3",
      "X-MSMail-Priority": "Normal",
      Importance: "Normal",
    },
  });

  return transporter;
}

// Template HTML para email de convite
function createInviteEmailTemplate(
  inviteCode,
  recipientEmail,
  senderName,
  expiresAt,
  role,
) {
  const inviteLink = generateInviteLink(inviteCode);

  const roleNames = {
    terapeuta: "Terapeuta",
    secretaria: "Secretaria",
    admin: "Administrador",
  };

  const roleName = roleNames[role] || "Usuário";

  // Formatar data de expiração
  const expirationDate = new Date(expiresAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Convite - Espaço Dialógico</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .container {
                background-color: #f9f9f9;
                padding: 30px;
                border-radius: 10px;
                border: 1px solid #ddd;
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .header h1 {
                color: #2563eb;
                margin: 0;
            }
            .content {
                background-color: white;
                padding: 25px;
                border-radius: 8px;
                margin-bottom: 20px;
            }
            .invite-code {
                background-color: #f3f4f6;
                padding: 15px;
                border-radius: 6px;
                font-family: monospace;
                font-size: 18px;
                text-align: center;
                margin: 20px 0;
                border: 2px dashed #9ca3af;
            }
            .button {
                display: inline-block;
                background-color: #2563eb;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                margin: 20px 0;
                font-weight: bold;
            }
            .button:hover {
                background-color: #1d4ed8;
            }
            .role-badge {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: bold;
                margin: 0 5px;
            }
            .role-terapeuta {
                background-color: #dbeafe;
                color: #1e40af;
            }
            .role-secretaria {
                background-color: #dcfce7;
                color: #166534;
            }
            .role-admin {
                background-color: #fdf2f8;
                color: #be185d;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
                color: #666;
                font-size: 14px;
            }
            .warning {
                background-color: #fef3c7;
                color: #92400e;
                padding: 15px;
                border-radius: 6px;
                margin: 20px 0;
                border-left: 4px solid #f59e0b;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎯 Espaço Dialógico</h1>
                <p>Você foi convidado para se juntar à nossa plataforma!</p>
            </div>
            
            <div class="content">
                <h2>Olá!</h2>
                <p><strong>${senderName}</strong> convidou você para se cadastrar no <strong>Espaço Dialógico</strong> com a função de:</p>
                
                <div style="text-align: center;">
                    <span class="role-badge role-${role}">${roleName}</span>
                </div>
                
                <p>Para aceitar o convite e criar sua conta, use o código abaixo ou clique no botão:</p>
                
                <div class="invite-code">
                    <strong>Código do Convite:</strong><br>
                    ${inviteCode}
                </div>
                
                <div style="text-align: center;">
                    <a href="${inviteLink}" class="button">Aceitar Convite</a>
                </div>
                
                <div class="warning">
                    <strong>⚠️ Importante:</strong> Este convite expira em <strong>${expirationDate}</strong>. 
                    Certifique-se de criar sua conta antes desta data.
                </div>
                
                <p><strong>Como usar:</strong></p>
                <ol>
                    <li>Clique no botão "Aceitar Convite" acima</li>
                    <li>Ou copie e cole o código na página de registro</li>
                    <li>Preencha seus dados para criar a conta</li>
                    <li>Comece a usar a plataforma!</li>
                </ol>
            </div>
            
            <div class="footer">
                <p>Se você não esperava este convite, pode ignorar este email.</p>
                <p>© 2025 Espaço Dialógico - Todos os direitos reservados.</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

// Função para enviar email de convite
async function sendInviteEmail(inviteData, senderName = "Sistema") {
  console.log("📧 Iniciando envio de email de convite...");
  console.log("📊 Dados recebidos:", { ...inviteData, code: inviteData.code });

  try {
    const transporter = createEmailTransporter();
    console.log("✅ Transportador criado com sucesso");

    const { email, code, role, expires_at } = inviteData;

    if (!email) {
      throw new Error("Email do destinatário é obrigatório");
    }

    console.log("🎨 Gerando template de email...");
    const emailTemplate = createInviteEmailTemplate(
      code,
      email,
      senderName,
      expires_at,
      role,
    );

    const inviteLink = generateInviteLink(code);
    console.log("🔗 Link de convite gerado:", inviteLink);

    const mailOptions = {
      from: {
        name: "Espaço Dialógico - Sistema",
        address: process.env.EMAIL_USER,
      },
      to: email,
      subject: `🎯 Convite para o Espaço Dialógico - ${code}`,
      html: emailTemplate,
      text: `
Você foi convidado para o Espaço Dialógico!

Código do convite: ${code}
Função: ${role}
Expira em: ${new Date(expires_at).toLocaleDateString("pt-BR")}

Para aceitar o convite, acesse: ${inviteLink}

Se você não esperava este convite, pode ignorar este email.
      `.trim(),
      // Headers adicionais para evitar spam no Outlook/Hotmail
      headers: {
        "Reply-To": process.env.EMAIL_USER,
        "Return-Path": process.env.EMAIL_USER,
        "X-Mailer": "Espaço Dialógico v1.0",
        "X-Priority": "3",
        "X-MSMail-Priority": "Normal",
        Importance: "Normal",
        "List-Unsubscribe": `<mailto:${process.env.EMAIL_USER}?subject=Unsubscribe>`,
        "Message-ID": `<${Date.now()}.${Math.random().toString(36).substr(2, 9)}@espacodialogico.com.br>`,
      },
      // Configurações de envelope
      envelope: {
        from: process.env.EMAIL_USER,
        to: email,
      },
    };

    console.log("📨 Enviando email...");
    const result = await transporter.sendMail(mailOptions);
    console.log("✅ Email enviado com sucesso:", result.messageId);

    return {
      success: true,
      messageId: result.messageId,
      message: "Email enviado com sucesso",
    };
  } catch (error) {
    console.error("❌ Erro detalhado no emailService:", error);
    console.error("📋 Stack trace:", error.stack);
    console.error("🔧 Configurações de email:", {
      EMAIL_USER: process.env.EMAIL_USER ? "✅ Definida" : "❌ Não definida",
      EMAIL_PASSWORD: process.env.EMAIL_PASSWORD
        ? "✅ Definida"
        : "❌ Não definida",
      service: "gmail",
    });

    return {
      success: false,
      error: error.message,
      message: "Falha ao enviar email",
      details: error.stack,
    };
  }
}

// Função para testar configuração de email
async function testEmailConfiguration() {
  try {
    const transporter = createEmailTransporter();
    await transporter.verify();
    return { success: true, message: "Configuração de email válida" };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export { sendInviteEmail, testEmailConfiguration, createInviteEmailTemplate };
