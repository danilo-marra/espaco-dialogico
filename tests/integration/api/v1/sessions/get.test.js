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
});
