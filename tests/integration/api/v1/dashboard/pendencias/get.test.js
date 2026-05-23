import orchestrator from "tests/orchestrator.js";
import database from "infra/database.js";

const port = process.env.PORT || 3000;

async function createAndLoginAdmin() {
  const email = "admin.pendencias@example.com";
  const password = "Password@123";

  const inviteCode =
    `T-F-A-${Math.random().toString(36).substring(2, 8)}`.toUpperCase();
  await database.query({
    text: "INSERT INTO invites (code, role, expires_at) VALUES ($1, 'admin', NOW() + INTERVAL '7 day')",
    values: [inviteCode],
  });

  const userResponse = await fetch(`http://localhost:${port}/api/v1/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "admin_pendencias",
      email,
      password,
      inviteCode,
    }),
  });

  if (userResponse.status !== 201) {
    const errorBody = await userResponse.json();
    throw new Error(
      `Falha ao criar usuário admin para teste de pendências: ${JSON.stringify(errorBody)}`,
    );
  }

  const loginResponse = await fetch(
    `http://localhost:${port}/api/v1/auth/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    },
  );

  const { token } = await loginResponse.json();
  return token;
}

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
});

describe("GET /api/v1/dashboard/pendencias", () => {
  test("usuário admin deve conseguir acessar as pendências do período", async () => {
    const token = await createAndLoginAdmin();
    const response = await fetch(
      `http://localhost:${port}/api/v1/dashboard/pendencias?periodo=2026-05`,
      {
        headers: { Authorization: "Bearer " + token },
      },
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("periodo", "2026-05");
    expect(body).toHaveProperty("resumo");
    expect(body).toHaveProperty("pacientesACobrar");
    expect(body).toHaveProperty("notasFiscaisPendentes");
    expect(body).toHaveProperty("marcacoesPendentes");
    expect(body).toHaveProperty("repassesPendentes");
  });

  test("deve retornar 400 para período inválido", async () => {
    const token = await createAndLoginAdmin();
    const response = await fetch(
      `http://localhost:${port}/api/v1/dashboard/pendencias?periodo=2026/05`,
      {
        headers: { Authorization: "Bearer " + token },
      },
    );

    expect(response.status).toBe(400);
  });

  test("usuário não autenticado deve receber 401", async () => {
    const response = await fetch(
      `http://localhost:${port}/api/v1/dashboard/pendencias`,
    );
    expect(response.status).toBe(401);
  });
});
