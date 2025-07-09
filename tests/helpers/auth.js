import database from "infra/database.js";

// Função reutilizável para garantir que o admin de desenvolvimento existe
export async function ensureDevAdminExists() {
  const bcryptjs = await import("bcryptjs");

  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminEmail = process.env.ADMIN_EMAIL || "admin@espacodialogico.com.br";
  const adminPassword = process.env.ADMIN_PASSWORD || "AdminDefaultPassword";

  // Verificar se o admin já existe
  const existingAdmin = await database.query({
    text: "SELECT id FROM users WHERE email = $1",
    values: [adminEmail],
  });

  if (existingAdmin.rows.length === 0) {
    // Criar o admin se não existir
    const saltRounds = 10;
    const hashedPassword = await bcryptjs.hash(adminPassword, saltRounds);

    await database.query({
      text: `
        INSERT INTO users (username, email, password, role)
        VALUES ($1, $2, $3, $4)
      `,
      values: [adminUsername, adminEmail, hashedPassword, "admin"],
    });

    console.log(
      `Admin ${adminUsername} (${adminEmail}) criado para desenvolvimento`,
    );
  }
}

// Função auxiliar para criar convites
export async function createInvite(email = null, role = "terapeuta") {
  const code = `TEST-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Expira em 7 dias

  const result = await database.query({
    text: `
      INSERT INTO invites (code, email, role, expires_at)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
    values: [code, email, role, expiresAt],
  });

  return result.rows[0]; // Adicione esta linha para retornar o convite criado
}

// Função reutilizável para autenticação nos testes
export async function prepareAuthentication(port) {
  try {
    const adminEmail =
      process.env.ADMIN_EMAIL || "admin@espacodialogico.com.br";
    const adminPassword = process.env.ADMIN_PASSWORD || "AdminDefaultPassword";

    const loginResponse = await fetch(
      `http://localhost:${port}/api/v1/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: adminEmail,
          password: adminPassword,
        }),
      },
    );

    if (!loginResponse.ok) {
      const errorBody = await loginResponse.json();
      throw new Error(
        `Falha ao fazer login com o usuário admin: ${JSON.stringify(
          errorBody,
        )}`,
      );
    }

    const loginData = await loginResponse.json();
    return loginData.token;
  } catch (error) {
    console.error("Erro fatal ao preparar autenticação:", error);
    // Retornar null para que os testes que dependem do token falhem claramente
    return null;
  }
}
