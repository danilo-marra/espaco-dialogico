/** @jest-environment node */

import fetch from "node-fetch";
import email from "infra/email.js";

const EMAIL_HTTP_HOST = process.env.EMAIL_HTTP_HOST;
const EMAIL_HTTP_PORT = process.env.EMAIL_HTTP_PORT;

if (!EMAIL_HTTP_HOST || !EMAIL_HTTP_PORT) {
  throw new Error(
    `EMAIL_HTTP_HOST and EMAIL_HTTP_PORT must be defined. Got EMAIL_HTTP_HOST="${EMAIL_HTTP_HOST}", EMAIL_HTTP_PORT="${EMAIL_HTTP_PORT}"`,
  );
}

const emailHttpUrl = `http://${EMAIL_HTTP_HOST}:${EMAIL_HTTP_PORT}`;

describe("infra/email.js", () => {
  test("send() envia email para Mailpit", async () => {
    const deleteResponse = await fetch(`${emailHttpUrl}/api/v1/messages`, {
      method: "DELETE",
    }).catch((err) => {
      throw new Error(`Mailpit unavailable at ${emailHttpUrl}: ${err.message}`);
    });
    if (!deleteResponse.ok) {
      throw new Error(
        `Failed to clear Mailpit messages: ${deleteResponse.status} ${await deleteResponse.text()}`,
      );
    }

    await email.send({
      from: "EspacoDialogico <contato@espacodialogico.com.br>",
      to: "contato@curso.dev",
      subject: "Teste infra/email",
      text: "Corpo de teste",
    });

    const emailListResponse = await fetch(`${emailHttpUrl}/api/v1/messages`);
    const emailListBody = await emailListResponse.json();

    expect(Array.isArray(emailListBody.messages)).toBe(true);
    expect(emailListBody.messages.length).toBeGreaterThan(0);

    const lastEmail = emailListBody.messages[0];

    expect(lastEmail.From.Address).toBe("contato@espacodialogico.com.br");
    expect(lastEmail.To[0].Address).toBe("contato@curso.dev");
    expect(lastEmail.Subject).toBe("Teste infra/email");
  });
});
