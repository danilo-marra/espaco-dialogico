import orchestrator from "tests/orchestrator.js";

// Use environment variables for port configuration
const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT || 3000;

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/auth/login", () => {
  describe("Autenticação de usuário", () => {
    // Primeiro criamos um usuário para testar a autenticação
    beforeEach(async () => {
      await fetch(`http://localhost:${port}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "usuario_teste",
          email: "usuario.teste@exemplo.com",
          password: "Senha@123",
        }),
      });
    });

    test("Login com credenciais válidas", async () => {
      const response = await fetch(
        `http://localhost:${port}/api/v1/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "usuario_teste",
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

      // A senha não deve estar presente nos dados do usuário
      expect(responseBody.user).not.toHaveProperty("password");

      // O token JWT deve ser uma string não vazia
      expect(typeof responseBody.token).toBe("string");
      expect(responseBody.token.length).toBeGreaterThan(0);
    });

    test("Login com usuário inexistente", async () => {
      const response = await fetch(
        `http://localhost:${port}/api/v1/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "usuario_inexistente",
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
            username: "usuario_teste",
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
            username: "usuario_teste",
            // senha não informada
          }),
        },
      );

      expect(response.status).toBe(400); // Bad Request

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        error: "Username e senha são obrigatórios",
      });
    });
  });
});
