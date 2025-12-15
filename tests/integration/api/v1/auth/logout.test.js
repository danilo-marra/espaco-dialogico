import orchestrator from "tests/orchestrator.js";
import database from "infra/database.js";

const port = process.env.PORT || 3000;

async function createAndLoginUser() {
  const role = "terapeuta";
  const email = `logout.user@example.com`;
  const password = "Password@123";

  const inviteCode =
    `T-O-${Math.random().toString(36).substring(2, 8)}`.toUpperCase();
  await database.query({
    text: "INSERT INTO invites (code, role, expires_at) VALUES ($1, $2, NOW() + INTERVAL '7 day')",
    values: [inviteCode, role],
  });

  const userResponse = await fetch(`http://localhost:${port}/api/v1/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "logout_user",
      email,
      password,
      inviteCode,
    }),
  });

  if (userResponse.status !== 201) {
    const errorBody = await userResponse.json();
    console.error("Error creating user in logout test:", errorBody);
    throw new Error(
      `Falha ao criar usuário de teste para logout: ${JSON.stringify(errorBody)}`,
    );
  }
  const user = await userResponse.json();

  const loginResponse = await fetch(
    `http://localhost:${port}/api/v1/auth/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    },
  );
  const { token } = await loginResponse.json();

  return { user, token };
}

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

beforeEach(async () => {
  await orchestrator.clearDatabase();
});

describe("POST /api/v1/auth/logout", () => {
  test("deve fazer logout e invalidar a sessão", async () => {
    const { user, token } = await createAndLoginUser();

    // Verificar acesso antes do logout
    const preLogoutResponse = await fetch(
      `http://localhost:${port}/api/v1/terapeutas`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    expect(preLogoutResponse.status).toBe(200);

    const response = await fetch(
      `http://localhost:${port}/api/v1/auth/logout`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.message).toBe("Logout realizado com sucesso.");

    const sessionInDb = await database.query({
      text: "SELECT * FROM user_sessions WHERE user_id = $1",
      values: [user.id],
    });
    expect(sessionInDb.rowCount).toBe(0);

    // Tentar usar o mesmo token em uma rota protegida deve falhar após o logout
    const postLogoutResponse = await fetch(
      `http://localhost:${port}/api/v1/test-protected`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    expect(postLogoutResponse.status).toBe(401);
    const postLogoutBody = await postLogoutResponse.json();
    expect(postLogoutBody.error).toBe(
      "Sessão inválida. Por favor, faça login novamente.",
    );
  });
});
