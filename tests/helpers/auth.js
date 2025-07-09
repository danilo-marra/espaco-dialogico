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
export async function createInvite(email = null, role = "admin") {
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

  return result.rows[0];
}

// Função reutilizável para autenticação nos testes
export async function prepareAuthentication(port) {
  try {
    // Tentar primeiro fazer login com o admin das variáveis de ambiente
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

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log(`Login realizado com admin existente: ${adminEmail}`);
      return loginData.token;
    }

    // Se o login falhar, criar um usuário temporário para teste
    console.log(
      "Falha no login com admin existente, criando usuário temporário para teste",
    );

    // 1. Criar um convite de administrador
    const invite = await createInvite(null, "admin");

    // 2. Criar um usuário admin para o teste
    const timestamp = Date.now();
    const createUserResponse = await fetch(
      `http://localhost:${port}/api/v1/users`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: `admin_${timestamp}`,
          email: `admin_${timestamp}@example.com`,
          password: "Senha@123",
          inviteCode: invite.code,
        }),
      },
    );

    if (!createUserResponse.ok) {
      console.error("Falha ao criar usuário:", await createUserResponse.json());
      return null;
    }

    // 3. Fazer login para obter o token
    const tempLoginResponse = await fetch(
      `http://localhost:${port}/api/v1/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: `admin_${timestamp}@example.com`,
          password: "Senha@123",
        }),
      },
    );

    if (!tempLoginResponse.ok) {
      console.error("Falha ao fazer login:", await tempLoginResponse.json());
      return null;
    }

    const loginData = await tempLoginResponse.json();
    return loginData.token;
  } catch (error) {
    console.error("Erro ao preparar autenticação:", error);
    return null;
  }
}
