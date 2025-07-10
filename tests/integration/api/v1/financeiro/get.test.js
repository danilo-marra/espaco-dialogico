import orchestrator from "tests/orchestrator.js";
import database from "infra/database.js";

const port = process.env.PORT || 3000;

async function createAndLoginAdmin() {
  const email = "admin.financeiro@example.com";
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
      username: "admin_financeiro",
      email,
      password,
      inviteCode,
    }),
  });

  if (userResponse.status !== 201) {
    const errorBody = await userResponse.json();
    console.error("Error creating admin user in finance test:", errorBody);
    throw new Error(
      `Falha ao criar usuário admin para teste financeiro: ${JSON.stringify(errorBody)}`,
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
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/dashboard/financeiro-otimizado", () => {
  test("usuário admin deve conseguir acessar os dados financeiros", async () => {
    const token = await createAndLoginAdmin();
    const response = await fetch(
      `http://localhost:${port}/api/v1/dashboard/financeiro-otimizado`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(typeof body).toBe("object");
  });

  test("usuário não autenticado deve receber 401", async () => {
    const response = await fetch(
      `http://localhost:${port}/api/v1/dashboard/financeiro-otimizado`,
    );
    expect(response.status).toBe(401);
  });
});
