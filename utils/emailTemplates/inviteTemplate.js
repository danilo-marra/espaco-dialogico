import { generateInviteLink } from "../getBaseUrl.js";

function createInviteEmailTemplate(inviteCode, senderName, expiresAt, role) {
  const inviteLink = generateInviteLink(inviteCode);

  const roleNames = {
    terapeuta: "Terapeuta",
    secretaria: "Secretaria",
    admin: "Administrador",
  };

  const roleName = roleNames[role] || "Usuário";

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
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Convite - Espaço Dialógico</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 10px; border: 1px solid #ddd;">
          <h1 style="color: #2563eb; text-align: center;">Você recebeu um convite</h1>

          <p>Olá,</p>
          <p>
            Você recebeu este convite porque um administrador cadastrou seu email no Espaço Dialógico.
          </p>
          <p>
            O convite permite acessar o sistema com a função de
            <strong>${roleName}</strong>.
          </p>

          <p><strong>Código do convite:</strong> ${inviteCode}</p>
          <p><strong>Validade:</strong> ${expirationDate}</p>
          <p><strong>Enviado por:</strong> ${senderName}</p>

          <p style="margin: 24px 0;">
            <a
              href="${inviteLink}"
              style="display: inline-block; background: #2563eb; color: #fff; text-decoration: none; padding: 12px 18px; border-radius: 8px;"
            >
              Aceitar convite
            </a>
          </p>

          <p>Se você não esperava este convite, desconsidere este email.</p>
          <p style="margin-top: 24px; font-size: 12px; color: #666;">Equipe Espaço Dialógico</p>
        </div>
      </body>
    </html>
  `;
}

function createInviteEmailText(inviteCode, senderName, expiresAt, role) {
  const inviteLink = generateInviteLink(inviteCode);

  const roleNames = {
    terapeuta: "Terapeuta",
    secretaria: "Secretaria",
    admin: "Administrador",
  };

  const roleName = roleNames[role] || "Usuário";

  return `Você recebeu um convite para o Espaço Dialógico.\n\nVocê recebeu este convite porque um administrador cadastrou seu email no Espaço Dialógico.\n\nCódigo: ${inviteCode}\nFunção: ${roleName}\nExpira em: ${new Date(expiresAt).toLocaleString("pt-BR")}\nEnviado por: ${senderName}\n\nLink: ${inviteLink}\n\nSe você não esperava este convite, ignore este email.`;
}

export { createInviteEmailTemplate, createInviteEmailText };
