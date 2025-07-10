import orchestrator from "tests/orchestrator.js";
import database from "infra/database.js";
import jwt from "jsonwebtoken";

const port = process.env.PORT || 3000;

async function createTestUser(role = "terapeuta") {
  const inviteCode =
    `T-L-${role.substring(0, 3)}-${Math.random().toString(36).substring(2, 8)}`.toUpperCase();
  const email = `user.${role}@example.com`;
  const password = "Password@123";

  await database.query({
    text: "INSERT INTO invites (code, role, expires_at) VALUES ($1, $2, NOW() + INTERVAL '7 day')",
    values: [inviteCode, role],
  });

  const userResponse = await fetch(`http://localhost:${port}/api/v1/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: `user_${role}`,
      email,
      password,
      inviteCode,
    }),
  });

  if (userResponse.status !== 201) {
    const errorBody = await userResponse.json();
    throw new Error(
      `Falha ao criar usuário de teste: ${JSON.stringify(errorBody)}`,
    );
  }

  const responseBody = await userResponse.json();
  console.log("Response from /api/v1/users:", responseBody);
  if (!responseBody || !responseBody.id) {
    throw new Error(
      `Falha ao extrair usuário da resposta: ${JSON.stringify(responseBody)}`,
    );
  }
  return responseBody;
}

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

beforeEach(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/auth/login", () => {
  test("deve autenticar com credenciais válidas e criar uma sessão", async () => {
    const user = await createTestUser("terapeuta");

    const response = await fetch(`http://localhost:${port}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "user.terapeuta@example.com",
        password: "Password@123",
      }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body.user.id).toBe(user.id);
    expect(body.user.email).toBe("user.terapeuta@example.com");
    expect(body).toHaveProperty("token");

    const decodedToken = jwt.decode(body.token);
    expect(decodedToken).toHaveProperty("sessionId");

    const sessionInDb = await database.query({
      text: "SELECT * FROM user_sessions WHERE user_id = $1",
      values: [user.id],
    });

    expect(sessionInDb.rowCount).toBe(1);
  });

  test("não deve autenticar com senha incorreta", async () => {
    await createTestUser("terapeuta");

    const response = await fetch(`http://localhost:${port}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "user.terapeuta@example.com",
        password: "senha-errada",
      }),
    });

    expect(response.status).toBe(401);
  });
});
