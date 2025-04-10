import orchestrator from "tests/orchestrator.js";

// Use environment variables for port configuration
const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT || 3000;

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/protected-route", () => {
  let authToken;
  let userId;

  // Criar usuário e obter token de autenticação antes dos testes
  beforeAll(async () => {
    // 1. Criar usuário
    const createUserResponse = await fetch(
      `http://localhost:${port}/api/v1/users`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "user_protegido",
          email: "user.protegido@exemplo.com",
          password: "Senha@123",
        }),
      },
    );

    const userData = await createUserResponse.json();
    userId = userData.id;

    // 2. Fazer login para obter token
    const loginResponse = await fetch(
      `http://localhost:${port}/api/v1/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "user_protegido",
          password: "Senha@123",
        }),
      },
    );

    const loginData = await loginResponse.json();
    authToken = loginData.token;
  });

  test("Acesso com token válido", async () => {
    const response = await fetch(
      `http://localhost:${port}/api/v1/protected-route`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    );

    expect(response.status).toBe(200);

    const responseBody = await response.json();
    expect(responseBody).toHaveProperty(
      "message",
      "Rota protegida acessada com sucesso",
    );
    expect(responseBody).toHaveProperty("user");
    expect(responseBody.user).toHaveProperty("id", userId);
    expect(responseBody.user).toHaveProperty("username", "user_protegido");
    expect(responseBody.user).toHaveProperty(
      "email",
      "user.protegido@exemplo.com",
    );
  });

  test("Acesso sem token", async () => {
    const response = await fetch(
      `http://localhost:${port}/api/v1/protected-route`,
    );

    expect(response.status).toBe(401);

    const responseBody = await response.json();
    expect(responseBody).toHaveProperty(
      "error",
      "Token de autenticação não fornecido",
    );
  });

  test("Acesso com token inválido", async () => {
    const response = await fetch(
      `http://localhost:${port}/api/v1/protected-route`,
      {
        headers: {
          Authorization: "Bearer token_invalido",
        },
      },
    );

    expect(response.status).toBe(401);

    const responseBody = await response.json();
    expect(responseBody).toHaveProperty("error", "Token inválido ou expirado");
  });

  test("Acesso com formato de token incorreto", async () => {
    const response = await fetch(
      `http://localhost:${port}/api/v1/protected-route`,
      {
        headers: {
          Authorization: "TokenInvalido",
        },
      },
    );

    expect(response.status).toBe(401);

    const responseBody = await response.json();
    expect(responseBody).toHaveProperty(
      "error",
      "Token de autenticação não fornecido",
    );
  });
});
