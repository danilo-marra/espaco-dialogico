import orchestrator from "tests/orchestrator.js";
import { ensureDevAdminExists } from "tests/helpers/auth.js";

// Use environment variables for port configuration
const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT || 3000;

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();

  // Verificar se o admin das variáveis de ambiente já existe
  await ensureDevAdminExists();
});

describe("GET /api/v1/admin/sessions", () => {
  test("Deve retornar erro 401 para usuário não autenticado", async () => {
    // Testar sem token de autenticação
    const response = await fetch(
      `http://localhost:${port}/api/v1/admin/sessions`,
      {
        method: "GET",
      },
    );

    expect(response.status).toBe(401);

    const responseBody = await response.json();
    expect(responseBody).toHaveProperty("error");
  });

  test("Deve retornar erro 401 para token inválido", async () => {
    // Testar com token inválido
    const response = await fetch(
      `http://localhost:${port}/api/v1/admin/sessions`,
      {
        method: "GET",
        headers: {
          Authorization: "Bearer token_invalido",
        },
      },
    );

    expect(response.status).toBe(401);

    const responseBody = await response.json();
    expect(responseBody).toHaveProperty("error");
  });

  test("Deve permitir acesso para usuário admin e listar sessões", async () => {
    // Usar admin das variáveis de ambiente
    const adminEmail = process.env.ADMIN_EMAIL || "danilo2311@gmail.com";
    const adminPassword =
      process.env.ADMIN_PASSWORD || "AdminPassword2025Secure";

    // Fazer login para obter token
    const loginResponse = await fetch(
      `http://localhost:${port}/api/v1/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      },
    );

    expect(loginResponse.status).toBe(200);
    const loginData = await loginResponse.json();
    expect(loginData).toHaveProperty("token");

    // Testar acesso com usuário admin
    const adminResponse = await fetch(
      `http://localhost:${port}/api/v1/admin/sessions`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${loginData.token}`,
        },
      },
    );

    expect(adminResponse.status).toBe(200);

    const adminResponseBody = await adminResponse.json();
    expect(adminResponseBody).toHaveProperty("sessions");
    expect(adminResponseBody).toHaveProperty("total");
    expect(Array.isArray(adminResponseBody.sessions)).toBe(true);
    expect(adminResponseBody.total).toBeGreaterThan(0);

    // Verificar estrutura das sessões retornadas
    expect(adminResponseBody.sessions.length).toBeGreaterThan(0);

    const session = adminResponseBody.sessions[0];
    expect(session).toHaveProperty("id");
    expect(session).toHaveProperty("user_id");
    expect(session).toHaveProperty("username");
    expect(session).toHaveProperty("email");
    expect(session).toHaveProperty("role");
    expect(session).toHaveProperty("status");
    expect(session).toHaveProperty("created_at");
    expect(session).toHaveProperty("expires_at");
  });
});

describe("POST /api/v1/admin/sessions", () => {
  test("Deve retornar erro 400 quando userId não é fornecido", async () => {
    // Usar admin das variáveis de ambiente
    const adminEmail = process.env.ADMIN_EMAIL || "danilo2311@gmail.com";
    const adminPassword =
      process.env.ADMIN_PASSWORD || "AdminPassword2025Secure";

    // Fazer login para obter token
    const loginResponse = await fetch(
      `http://localhost:${port}/api/v1/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      },
    );

    expect(loginResponse.status).toBe(200);
    const loginData = await loginResponse.json();
    const adminToken = loginData.token;

    // Tentar forçar logout sem userId
    const response = await fetch(
      `http://localhost:${port}/api/v1/admin/sessions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "all",
        }),
      },
    );

    expect(response.status).toBe(400);

    const responseBody = await response.json();
    expect(responseBody).toHaveProperty("error");
    expect(responseBody.error).toBe("userId é obrigatório");
  });

  test("Deve retornar erro 401 para usuário não autenticado tentando forçar logout", async () => {
    const response = await fetch(
      `http://localhost:${port}/api/v1/admin/sessions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: 999,
          action: "all",
        }),
      },
    );

    expect(response.status).toBe(401);

    const responseBody = await response.json();
    expect(responseBody).toHaveProperty("error");
  });

  test("Deve retornar erro 401 para token inválido tentando forçar logout", async () => {
    const response = await fetch(
      `http://localhost:${port}/api/v1/admin/sessions`,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer token_invalido",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: 999,
          action: "all",
        }),
      },
    );

    expect(response.status).toBe(401);

    const responseBody = await response.json();
    expect(responseBody).toHaveProperty("error");
  });

  test("Deve funcionar corretamente o controle de sessões do admin", async () => {
    // Este teste documenta o comportamento completo do sistema de sessões
    const adminEmail = process.env.ADMIN_EMAIL || "danilo2311@gmail.com";
    const adminPassword =
      process.env.ADMIN_PASSWORD || "AdminPassword2025Secure";

    // 1. Login como admin
    const loginResponse = await fetch(
      `http://localhost:${port}/api/v1/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      },
    );

    expect(loginResponse.status).toBe(200);
    const loginData = await loginResponse.json();
    const adminToken = loginData.token;

    // 2. Verificar que admin pode listar sessões
    const listSessionsResponse = await fetch(
      `http://localhost:${port}/api/v1/admin/sessions`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      },
    );

    expect(listSessionsResponse.status).toBe(200);
    const sessionsList = await listSessionsResponse.json();

    // Deve ter pelo menos uma sessão (a do próprio admin)
    expect(sessionsList.total).toBeGreaterThan(0);
    expect(sessionsList.sessions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          email: adminEmail,
          role: "admin",
          status: "active",
        }),
      ]),
    );

    // 3. Verificar que o sistema implementa "uma sessão por usuário"
    // Fazer login novamente deve invalidar a sessão anterior
    const secondLoginResponse = await fetch(
      `http://localhost:${port}/api/v1/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      },
    );

    expect(secondLoginResponse.status).toBe(200);
    const secondLoginData = await secondLoginResponse.json();
    const newAdminToken = secondLoginData.token;

    // O token antigo deve ter sido invalidado
    const oldTokenResponse = await fetch(
      `http://localhost:${port}/api/v1/admin/sessions`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      },
    );

    expect(oldTokenResponse.status).toBe(401);

    // O novo token deve funcionar
    const newTokenResponse = await fetch(
      `http://localhost:${port}/api/v1/admin/sessions`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${newAdminToken}`,
        },
      },
    );

    expect(newTokenResponse.status).toBe(200);
  });

  test("Deve forçar a revalidação do token se a sessão não existir no banco de dados", async () => {
    const adminEmail = process.env.ADMIN_EMAIL || "danilo2311@gmail.com";
    const adminPassword =
      process.env.ADMIN_PASSWORD || "AdminPassword2025Secure";

    // 1. Fazer login e obter um token
    const loginResponse = await fetch(
      `http://localhost:${port}/api/v1/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      },
    );
    expect(loginResponse.status).toBe(200);
    const loginData = await loginResponse.json();
    const adminToken = loginData.token;

    // 2. Simular invalidação da sessão no servidor (ex: deploy de nova versão)
    // Incrementar a token_version do usuário diretamente no banco
    const { default: userModel } = await import("models/user.js");
    // Re-fetch the admin user to ensure we have the latest data, including the correct ID
    const freshAdminUser = await userModel.findOneByEmail(adminEmail);
    await userModel.incrementTokenVersion(freshAdminUser.id);

    // 3. Tentar usar o token antigo que ainda está no "cache" do cliente
    const oldTokenResponse = await fetch(
      `http://localhost:${port}/api/v1/admin/sessions`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      },
    );

    // A aplicação deve retornar 401, forçando o cliente a fazer login novamente
    expect(oldTokenResponse.status).toBe(401);
    const oldTokenBody = await oldTokenResponse.json();
    expect(oldTokenBody.error).toBe(
      "Sessão inválida. Por favor, faça login novamente.",
    );
  });

  test("Deve manter apenas uma sessão ativa por usuário", async () => {
    const adminEmail = process.env.ADMIN_EMAIL || "danilo2311@gmail.com";
    const adminPassword =
      process.env.ADMIN_PASSWORD || "AdminPassword2025Secure";

    // 1. Fazer o primeiro login
    const firstLoginResponse = await fetch(
      `http://localhost:${port}/api/v1/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      },
    );
    expect(firstLoginResponse.status).toBe(200);
    const firstLoginData = await firstLoginResponse.json();
    const firstToken = firstLoginData.token;

    // 2. Fazer o segundo login em outro "dispositivo"
    const secondLoginResponse = await fetch(
      `http://localhost:${port}/api/v1/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      },
    );
    expect(secondLoginResponse.status).toBe(200);
    const secondLoginData = await secondLoginResponse.json();
    const secondToken = secondLoginData.token;

    // 3. Verificar se o primeiro token foi invalidado
    const firstTokenResponse = await fetch(
      `http://localhost:${port}/api/v1/me`, // Usar um endpoint qualquer para verificar a sessão
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${firstToken}`,
        },
      },
    );
    expect(firstTokenResponse.status).toBe(401);

    // 4. Verificar se o segundo token é válido
    const secondTokenResponse = await fetch(
      `http://localhost:${port}/api/v1/me`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${secondToken}`,
        },
      },
    );
    expect(secondTokenResponse.status).toBe(200);
  });

  test("Deve demonstrar o comportamento do sistema de interceptação de sessão", async () => {
    // Este teste documenta como o sistema funciona do ponto de vista do cliente
    const adminEmail = process.env.ADMIN_EMAIL || "danilo2311@gmail.com";
    const adminPassword =
      process.env.ADMIN_PASSWORD || "AdminPassword2025Secure";

    // 1. Fazer login normalmente
    const loginResponse = await fetch(
      `http://localhost:${port}/api/v1/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      },
    );

    expect(loginResponse.status).toBe(200);
    const loginData = await loginResponse.json();
    const token = loginData.token;

    // 2. Verificar que o token funciona inicialmente
    const validTokenResponse = await fetch(
      `http://localhost:${port}/api/v1/me`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    expect(validTokenResponse.status).toBe(200);

    // 3. Simular invalidação da sessão no servidor
    const { default: userModel } = await import("models/user.js");
    const adminUser = await userModel.findOneByEmail(adminEmail);
    await userModel.incrementTokenVersion(adminUser.id);

    // 4. Tentar usar o token invalidado
    const invalidTokenResponse = await fetch(
      `http://localhost:${port}/api/v1/me`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    // 5. Verificar que retorna 401 com mensagem específica
    expect(invalidTokenResponse.status).toBe(401);
    const invalidTokenBody = await invalidTokenResponse.json();
    expect(invalidTokenBody.error).toBe(
      "Sessão inválida. Por favor, faça login novamente.",
    );

    // 6. Verificar que uma nova sessão pode ser criada
    const newLoginResponse = await fetch(
      `http://localhost:${port}/api/v1/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      },
    );

    expect(newLoginResponse.status).toBe(200);
    const newLoginData = await newLoginResponse.json();
    const newToken = newLoginData.token;

    // 7. Verificar que o novo token funciona
    const newValidTokenResponse = await fetch(
      `http://localhost:${port}/api/v1/me`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${newToken}`,
        },
      },
    );
    expect(newValidTokenResponse.status).toBe(200);

    // Documentar o comportamento esperado no frontend:
    // - O authenticatedFetch detectaria o erro 401
    // - Limparia o localStorage
    // - Redirecionaria para /login
    // - Mostraria toast de erro
    console.log(
      "✅ Sistema de interceptação: O frontend detectaria este erro 401 e redirecionaria automaticamente",
    );
  });
});
