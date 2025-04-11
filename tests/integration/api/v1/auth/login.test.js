import orchestrator from "tests/orchestrator.js";
import database from "infra/database.js";

// Use environment variables for port configuration
const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT || 3000;

// Função auxiliar para criar um convite diretamente no banco de dados
async function createInvite(email = null, role = "user") {
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

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/auth/login", () => {
  describe("Autenticação de usuário", () => {
    // Criamos os convites e usuários para testar a autenticação
    let userInvite, adminInvite;

    beforeEach(async () => {
      // Criar convites reais no banco de dados
      userInvite = await createInvite(null, "user");
      adminInvite = await createInvite(null, "admin");

      // Criar usuário comum para teste
      const userResponse = await fetch(
        `http://localhost:${port}/api/v1/users`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "usuario_teste",
            email: "usuario.teste@exemplo.com",
            password: "Senha@123",
            inviteCode: userInvite.code,
          }),
        },
      );

      if (userResponse.status !== 201) {
        console.error(
          "Falha ao criar usuário de teste:",
          await userResponse.json(),
        );
      }

      // Criar usuário admin para teste
      const adminResponse = await fetch(
        `http://localhost:${port}/api/v1/users`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "admin_teste",
            email: "admin.teste@exemplo.com",
            password: "Senha@123",
            inviteCode: adminInvite.code,
          }),
        },
      );

      if (adminResponse.status !== 201) {
        console.error(
          "Falha ao criar usuário admin:",
          await adminResponse.json(),
        );
      }
    });

    test("Login com credenciais válidas - usuário normal", async () => {
      const response = await fetch(
        `http://localhost:${port}/api/v1/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "usuario.teste@exemplo.com",
            password: "Senha@123",
          }),
        },
      );

      expect(response.status).toBe(200); // OK

      const responseBody = await response.json();

      // Verificar se retornou objeto com dados do usuário e token
      expect(responseBody).toHaveProperty("user");
      expect(responseBody).toHaveProperty("token");

      // Verificar se os dados do usuário estão corretos
      expect(responseBody.user).toHaveProperty("id");
      expect(responseBody.user.username).toBe("usuario_teste");
      expect(responseBody.user.email).toBe("usuario.teste@exemplo.com");
      expect(responseBody.user.role).toBe("user");

      // A senha não deve estar presente nos dados do usuário
      expect(responseBody.user).not.toHaveProperty("password");

      // O token JWT deve ser uma string não vazia
      expect(typeof responseBody.token).toBe("string");
      expect(responseBody.token.length).toBeGreaterThan(0);
    });

    test("Login com credenciais válidas - usuário administrador", async () => {
      const response = await fetch(
        `http://localhost:${port}/api/v1/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "admin.teste@exemplo.com",
            password: "Senha@123",
          }),
        },
      );

      expect(response.status).toBe(200); // OK

      const responseBody = await response.json();

      // Verificar role de administrador
      expect(responseBody.user.role).toBe("admin");
      expect(responseBody.user.username).toBe("admin_teste");
      expect(responseBody.user.email).toBe("admin.teste@exemplo.com");
      expect(responseBody.user).not.toHaveProperty("password");
    });

    test("Login com email inexistente", async () => {
      const response = await fetch(
        `http://localhost:${port}/api/v1/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "inexistente@exemplo.com",
            password: "Senha@123",
          }),
        },
      );

      expect(response.status).toBe(401); // Unauthorized

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        error: "Credenciais inválidas",
      });
    });

    test("Login com senha incorreta", async () => {
      const response = await fetch(
        `http://localhost:${port}/api/v1/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "usuario.teste@exemplo.com",
            password: "senha_incorreta",
          }),
        },
      );

      expect(response.status).toBe(401); // Unauthorized

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        error: "Credenciais inválidas",
      });
    });

    test("Login sem informar campos obrigatórios", async () => {
      const response = await fetch(
        `http://localhost:${port}/api/v1/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "usuario.teste@exemplo.com",
            // senha não informada
          }),
        },
      );

      expect(response.status).toBe(400); // Bad Request

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        error: "Email e senha são obrigatórios",
      });
    });
  });
});
