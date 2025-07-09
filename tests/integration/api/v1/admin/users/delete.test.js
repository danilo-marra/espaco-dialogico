import orchestrator from "tests/orchestrator.js";
import database from "infra/database.js";
import bcrypt from "bcryptjs";
import { ensureDevAdminExists } from "tests/helpers/auth.js";

// Use environment variables for port configuration
const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT || 3000;

// Função auxiliar para criar um usuário de teste
async function createTestUser(username, email, password, role = "terapeuta") {
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await database.query({
    text: `
      INSERT INTO users (username, email, password, role)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
    values: [username, email, hashedPassword, role],
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

  // Verificar se o admin das variáveis de ambiente já existe
  await ensureDevAdminExists();
});

describe("DELETE /api/v1/admin/users/[userId]", () => {
  test("Deve excluir o usuário quando solicitado por um administrador", async () => {
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

    // 3. Tentar excluir o usuário regular
    const deleteResponse = await fetch(
      `http://localhost:${port}/api/v1/admin/users/${regularUser.username}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      },
    );

    // 4. Verificar se a exclusão foi bem-sucedida
    expect(deleteResponse.status).toBe(200);

    const responseBody = await deleteResponse.json();
    expect(responseBody.message).toBe("Usuário excluído com sucesso");

    // 5. Verificar se o usuário foi realmente excluído do banco de dados
    const checkResult = await database.query({
      text: `SELECT * FROM users WHERE username = $1`,
      values: [regularUser.username],
    });

    expect(checkResult.rowCount).toBe(0);
  });

  test("Deve excluir múltiplos usuários em sequência", async () => {
    // 1. Criar um administrador e vários usuários regulares
    const timestamp = Date.now();
    const adminUser = await createTestUser(
      `admin_multi_${timestamp}`,
      `admin_multi_${timestamp}@test.com`,
      "senha123456",
      "admin",
    );

    // Criar 3 usuários para serem excluídos
    const user1 = await createTestUser(
      `user1_${timestamp}`,
      `user1_${timestamp}@test.com`,
      "senha123456",
    );

    const user2 = await createTestUser(
      `user2_${timestamp}`,
      `user2_${timestamp}@test.com`,
      "senha123456",
    );

    const user3 = await createTestUser(
      `user3_${timestamp}`,
      `user3_${timestamp}@test.com`,
      "senha123456",
    );

    // 2. Obter token de autenticação do admin
    const adminToken = await loginUser(adminUser.email, "senha123456");

    // 3. Excluir os usuários em sequência
    for (const user of [user1, user2, user3]) {
      const deleteResponse = await fetch(
        `http://localhost:${port}/api/v1/admin/users/${user.username}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        },
      );

      expect(deleteResponse.status).toBe(200);

      // Verificar se o usuário foi realmente excluído do banco de dados
      const checkResult = await database.query({
        text: `SELECT * FROM users WHERE username = $1`,
        values: [user.username],
      });

      expect(checkResult.rowCount).toBe(0);
    }
  });

  test("Deve rejeitar exclusão quando o usuário não é um administrador", async () => {
    // 1. Criar usuários para o teste
    const timestamp = Date.now();
    const regularUser1 = await createTestUser(
      `user1_rej_${timestamp}`,
      `user1_rej_${timestamp}@test.com`,
      "senha123456",
      "terapeuta",
    );

    const regularUser2 = await createTestUser(
      `user2_rej_${timestamp}`,
      `user2_rej_${timestamp}@test.com`,
      "senha123456",
      "terapeuta",
    );

    // 2. Obter token de autenticação do usuário regular (não admin)
    const userToken = await loginUser(regularUser1.email, "senha123456");

    // 3. Tentar excluir outro usuário usando token de usuário comum
    const deleteResponse = await fetch(
      `http://localhost:${port}/api/v1/admin/users/${regularUser2.username}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      },
    );

    // 4. Verificar que a operação foi rejeitada
    expect(deleteResponse.status).toBe(403);

    const responseBody = await deleteResponse.json();
    expect(responseBody.error).toBe("Acesso restrito a administradores");

    // 5. Verificar que o usuário NÃO foi excluído do banco de dados
    const checkResult = await database.query({
      text: `SELECT * FROM users WHERE username = $1`,
      values: [regularUser2.username],
    });

    expect(checkResult.rowCount).toBe(1);
  });

  test("Deve rejeitar exclusão quando o usuário não existe", async () => {
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

    // 3. Tentar excluir um usuário inexistente
    const deleteResponse = await fetch(
      `http://localhost:${port}/api/v1/admin/users/non_existent_user_${timestamp}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      },
    );

    // 4. Verificar que a operação foi rejeitada
    expect(deleteResponse.status).toBe(404);

    const responseBody = await deleteResponse.json();
    expect(responseBody.message).toBe("Usuário não encontrado.");
  });

  test("Deve impedir que um administrador exclua sua própria conta", async () => {
    // 1. Criar usuário admin para o teste
    const timestamp = Date.now();
    const adminUser = await createTestUser(
      `admin_self_${timestamp}`,
      `admin_self_${timestamp}@test.com`,
      "senha123456",
      "admin",
    );

    // 2. Obter token de autenticação do admin
    const adminToken = await loginUser(adminUser.email, "senha123456");

    // 3. Tentar excluir a própria conta
    const deleteResponse = await fetch(
      `http://localhost:${port}/api/v1/admin/users/${adminUser.username}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      },
    );

    // 4. Verificar que a operação foi rejeitada
    expect(deleteResponse.status).toBe(400);

    const responseBody = await deleteResponse.json();
    expect(responseBody.error).toBe("Você não pode excluir sua própria conta");

    // 5. Verificar que a conta do administrador ainda existe
    const checkResult = await database.query({
      text: `SELECT * FROM users WHERE username = $1`,
      values: [adminUser.username],
    });

    expect(checkResult.rowCount).toBe(1);
  });

  test("Deve validar o token de autenticação", async () => {
    // 1. Criar usuários para o teste
    const timestamp = Date.now();
    const regularUser = await createTestUser(
      `user_auth_${timestamp}`,
      `user_auth_${timestamp}@test.com`,
      "senha123456",
      "terapeuta",
    );

    // 2. Realizar a requisição DELETE sem token
    const deleteResponse = await fetch(
      `http://localhost:${port}/api/v1/admin/users/${regularUser.username}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    // 3. Verificar que a operação foi rejeitada por falta de autenticação
    expect(deleteResponse.status).toBe(401);

    // 4. Verificar que o usuário NÃO foi excluído do banco de dados
    const checkResult = await database.query({
      text: `SELECT * FROM users WHERE username = $1`,
      values: [regularUser.username],
    });

    expect(checkResult.rowCount).toBe(1);
  });

  test("Deve rejeitar token inválido", async () => {
    // 1. Criar usuário para o teste
    const timestamp = Date.now();
    const regularUser = await createTestUser(
      `user_bad_token_${timestamp}`,
      `user_bad_token_${timestamp}@test.com`,
      "senha123456",
      "terapeuta",
    );

    // 2. Usar um token inválido
    const invalidToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

    // 3. Tentar excluir com token inválido
    const deleteResponse = await fetch(
      `http://localhost:${port}/api/v1/admin/users/${regularUser.username}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${invalidToken}`,
        },
      },
    );

    // 4. Verificar que a operação foi rejeitada
    expect(deleteResponse.status).toBe(401);

    // 5. Verificar que o usuário NÃO foi excluído do banco de dados
    const checkResult = await database.query({
      text: `SELECT * FROM users WHERE username = $1`,
      values: [regularUser.username],
    });

    expect(checkResult.rowCount).toBe(1);
  });
});
