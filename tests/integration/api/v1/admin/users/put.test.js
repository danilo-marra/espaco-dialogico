import orchestrator from "tests/orchestrator.js";
import database from "infra/database.js";
import bcrypt from "bcryptjs";
import { fail } from "@jest/globals";

// Use environment variables for port configuration
const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT || 3000;

// Função auxiliar para criar um usuário de teste
async function createTestUser(username, email, password, role = "terapeuta") {
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await database.query({
    text: `
      INSERT INTO users (username, email, password, role, token_version)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    values: [username, email, hashedPassword, role, 0],
  });

  return result.rows[0];
}

// Função auxiliar para fazer login e obter token
async function loginUser(email, password) {
  const loginResponse = await fetch(
    `http://localhost:${port}/api/v1/auth/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    },
  );

  if (loginResponse.status !== 200) {
    throw new Error(
      `Falha ao fazer login: ${JSON.stringify(await loginResponse.json())}`,
    );
  }

  const loginData = await loginResponse.json();
  return loginData.token;
}

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PUT /api/v1/admin/users/[userId]", () => {
  test("Deve atualizar o usuário quando solicitado por um administrador", async () => {
    // 1. Criar usuários para o teste
    const timestamp = Date.now();
    const adminUser = await createTestUser(
      `admin_${timestamp}`,
      `admin_${timestamp}@test.com`,
      "senha123456",
      "admin",
    );

    const regularUser = await createTestUser(
      `user_${timestamp}`,
      `user_${timestamp}@test.com`,
      "senha123456",
      "terapeuta",
    );

    // 2. Obter token de autenticação do admin
    const adminToken = await loginUser(adminUser.email, "senha123456");

    // 3. Dados para atualização
    const updateData = {
      email: `updated_${timestamp}@test.com`,
      role: "admin",
    };

    // 4. Tentar atualizar o usuário regular usando o token do administrador
    const updateResponse = await fetch(
      `http://localhost:${port}/api/v1/admin/users/${regularUser.username}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(updateData),
      },
    );

    // 5. Verificar se a atualização foi bem-sucedida
    expect(updateResponse.status).toBe(200);

    const responseBody = await updateResponse.json();
    expect(responseBody.message).toBe("Usuário atualizado com sucesso");
    expect(responseBody.user.email).toBe(updateData.email);
    expect(responseBody.user.role).toBe(updateData.role);

    // 6. Verificar se o usuário foi realmente atualizado no banco de dados
    const checkResult = await database.query({
      text: `SELECT * FROM users WHERE username = $1`,
      values: [regularUser.username],
    });

    const updatedUser = checkResult.rows[0];
    expect(updatedUser.email).toBe(updateData.email);
    expect(updatedUser.role).toBe(updateData.role);
  });

  test("Deve atualizar a senha quando solicitado por um administrador", async () => {
    // 1. Criar usuários para o teste
    const timestamp = Date.now();
    const adminUser = await createTestUser(
      `admin_pwd_${timestamp}`,
      `admin_pwd_${timestamp}@test.com`,
      "senha123456",
      "admin",
    );

    const regularUser = await createTestUser(
      `user_pwd_${timestamp}`,
      `user_pwd_${timestamp}@test.com`,
      "senha123456",
      "terapeuta",
    );

    // 2. Obter token de autenticação do admin
    const adminToken = await loginUser(adminUser.email, "senha123456");

    // 3. Dados para atualização (nova senha)
    const updateData = {
      password: "novasenha12345",
    };

    // 4. Atualizar a senha do usuário
    const updateResponse = await fetch(
      `http://localhost:${port}/api/v1/admin/users/${regularUser.username}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(updateData),
      },
    );

    expect(updateResponse.status).toBe(200);

    // 5. Tentar fazer login com a nova senha para verificar se foi atualizada corretamente
    try {
      const userToken = await loginUser(regularUser.email, "novasenha12345");
      expect(userToken).toBeTruthy(); // Se chegou aqui, o login foi bem-sucedido
    } catch (error) {
      fail("Não foi possível fazer login com a nova senha");
    }
  });

  test("Deve rejeitar atualização quando o usuário não é um administrador", async () => {
    // 1. Criar usuários para o teste
    const timestamp = Date.now();
    const adminUser = await createTestUser(
      `admin_rej_${timestamp}`,
      `admin_rej_${timestamp}@test.com`,
      "senha123456",
      "admin",
    );

    const regularUser = await createTestUser(
      `user_rej_${timestamp}`,
      `user_rej_${timestamp}@test.com`,
      "senha123456",
      "terapeuta",
    );

    // 2. Obter token de autenticação do usuário regular (não admin)
    const userToken = await loginUser(regularUser.email, "senha123456");

    // 3. Dados para atualização
    const updateData = {
      email: `should_not_update_${timestamp}@test.com`,
    };

    // 4. Tentar atualizar o admin usando token de usuário comum
    const updateResponse = await fetch(
      `http://localhost:${port}/api/v1/admin/users/${adminUser.username}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify(updateData),
      },
    );

    // 5. Verificar que a operação foi rejeitada
    expect(updateResponse.status).toBe(403);

    const responseBody = await updateResponse.json();
    expect(responseBody.error).toBe("Acesso restrito a administradores");

    // 6. Verificar que o usuário não foi atualizado
    const checkResult = await database.query({
      text: `SELECT * FROM users WHERE username = $1`,
      values: [adminUser.username],
    });

    const notUpdatedUser = checkResult.rows[0];
    expect(notUpdatedUser.email).toBe(adminUser.email);
  });

  test("Deve rejeitar atualização quando o usuário não existe", async () => {
    // 1. Criar usuário admin para o teste
    const timestamp = Date.now();
    const adminUser = await createTestUser(
      `admin_404_${timestamp}`,
      `admin_404_${timestamp}@test.com`,
      "senha123456",
      "admin",
    );

    // 2. Obter token de autenticação do admin
    const adminToken = await loginUser(adminUser.email, "senha123456");

    // 3. Dados para atualização
    const updateData = {
      email: `new_email_${timestamp}@test.com`,
    };

    // 4. Tentar atualizar um usuário inexistente
    const updateResponse = await fetch(
      `http://localhost:${port}/api/v1/admin/users/non_existent_user_${timestamp}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(updateData),
      },
    );

    // 5. Verificar que a operação foi rejeitada
    expect(updateResponse.status).toBe(400);

    const responseBody = await updateResponse.json();
    expect(responseBody.message).toBe("Usuário não encontrado.");
  });

  test("Deve rejeitar senha muito curta", async () => {
    // 1. Criar usuários para o teste
    const timestamp = Date.now();
    const adminUser = await createTestUser(
      `admin_pwd_short_${timestamp}`,
      `admin_pwd_short_${timestamp}@test.com`,
      "senha123456",
      "admin",
    );

    const regularUser = await createTestUser(
      `user_pwd_short_${timestamp}`,
      `user_pwd_short_${timestamp}@test.com`,
      "senha123456",
      "terapeuta",
    );

    // 2. Obter token de autenticação do admin
    const adminToken = await loginUser(adminUser.email, "senha123456");

    // 3. Dados para atualização com senha muito curta
    const updateData = {
      password: "123",
    };

    // 4. Tentar atualizar com senha curta
    const updateResponse = await fetch(
      `http://localhost:${port}/api/v1/admin/users/${regularUser.username}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(updateData),
      },
    );

    // 5. Verificar que a operação foi rejeitada
    expect(updateResponse.status).toBe(400);

    const responseBody = await updateResponse.json();
    expect(responseBody.error).toBe("A senha deve ter pelo menos 8 caracteres");
  });

  test("Deve rejeitar requisição sem dados para atualizar", async () => {
    // 1. Criar usuários para o teste
    const timestamp = Date.now();
    const adminUser = await createTestUser(
      `admin_nodata_${timestamp}`,
      `admin_nodata_${timestamp}@test.com`,
      "senha123456",
      "admin",
    );

    const regularUser = await createTestUser(
      `user_nodata_${timestamp}`,
      `user_nodata_${timestamp}@test.com`,
      "senha123456",
      "terapeuta",
    );

    // 2. Obter token de autenticação do admin
    const adminToken = await loginUser(adminUser.email, "senha123456");

    // 3. Enviar requisição sem dados
    const updateResponse = await fetch(
      `http://localhost:${port}/api/v1/admin/users/${regularUser.username}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({}),
      },
    );

    // 4. Verificar que a operação foi rejeitada
    expect(updateResponse.status).toBe(400);

    const responseBody = await updateResponse.json();
    expect(responseBody.error).toBe("Nenhum campo fornecido para atualização");
  });
});
