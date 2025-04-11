import { version as uuidVersion } from "uuid";
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

describe("GET /api/v1/users/[username]", () => {
  let authToken;
  let invite;

  beforeAll(async () => {
    // Criar um convite para usar nos testes
    invite = await createInvite();

    // Criar um usuário para autenticar - sem verificações aqui
    const createUserResponse = await fetch(
      `http://localhost:${port}/api/v1/users`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "testadmin",
          email: "admin@example.com",
          password: "Senha@123",
          inviteCode: invite.code,
        }),
      },
    );

    if (!createUserResponse.ok) {
      console.error("Falha ao criar usuário:", await createUserResponse.json());
    }

    // Fazer login para obter token de autenticação - agora usando email em vez de username
    const loginResponse = await fetch(
      `http://localhost:${port}/api/v1/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "admin@example.com", // Alterado de username para email
          password: "Senha@123",
        }),
      },
    );

    const loginData = await loginResponse.json();
    authToken = loginData.token;

    // Se o token não foi obtido, registre o erro mas não use expect
    if (!authToken) {
      console.error("Falha ao obter token:", loginData);
      console.error("Resposta do servidor:", loginResponse.status);
      // Não vamos interromper os testes aqui, eles falharão naturalmente depois
    }
  });

  describe("Logged User", () => {
    // O primeiro teste deve verificar se temos um token válido antes de continuar
    test("Authentication setup is successful", async () => {
      // Verificar se temos um token válido
      expect(authToken).toBeTruthy();
    });

    test("With exact case match", async () => {
      // Criar um novo convite para este teste
      const newInvite = await createInvite();

      // Criar um usuário para testar a busca
      const response1 = await fetch(`http://localhost:${port}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          username: "MesmoCase",
          email: "mesmo.case@example.com",
          password: "Senha@123",
          inviteCode: newInvite.code,
        }),
      });

      expect(response1.status).toBe(201); // created

      // Buscar o usuário criado com autenticação
      const response2 = await fetch(
        `http://localhost:${port}/api/v1/users/MesmoCase`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      expect(response2.status).toBe(200); // ok

      const response2Body = await response2.json();

      // Verificar que o usuário é retornado sem a senha
      expect(response2Body).toEqual({
        id: response2Body.id,
        username: "MesmoCase",
        email: "mesmo.case@example.com",
        role: "user", // Verificando o role padrão
        created_at: response2Body.created_at,
        updated_at: response2Body.updated_at,
      });

      // Verificar explicitamente que a senha não está presente
      expect(response2Body.password).toBeUndefined();

      expect(uuidVersion(response2Body.id)).toBe(4);
      expect(Date.parse(response2Body.created_at)).not.toBeNaN();
      expect(Date.parse(response2Body.updated_at)).not.toBeNaN();
    });

    test("With case mismatch", async () => {
      // Criar um novo convite para este teste
      const newInvite = await createInvite();

      // Criar um usuário para testar a busca com case diferente
      const response1 = await fetch(`http://localhost:${port}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          username: "CaseDiferente",
          email: "case.diferente@example.com",
          password: "Senha@123",
          inviteCode: newInvite.code,
        }),
      });

      expect(response1.status).toBe(201); // created

      // Buscar o usuário com case diferente
      const response2 = await fetch(
        `http://localhost:${port}/api/v1/users/casediferente`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      expect(response2.status).toBe(200); // ok

      const response2Body = await response2.json();

      // Verificar que o usuário é retornado sem a senha
      expect(response2Body).toEqual({
        id: response2Body.id,
        username: "CaseDiferente",
        email: "case.diferente@example.com",
        role: "user", // Verificando o role padrão
        created_at: response2Body.created_at,
        updated_at: response2Body.updated_at,
      });

      // Verificar explicitamente que a senha não está presente
      expect(response2Body.password).toBeUndefined();

      expect(uuidVersion(response2Body.id)).toBe(4);
      expect(Date.parse(response2Body.created_at)).not.toBeNaN();
      expect(Date.parse(response2Body.updated_at)).not.toBeNaN();
    });

    test("With username not found", async () => {
      // Testar busca de usuário inexistente
      const response = await fetch(
        `http://localhost:${port}/api/v1/users/UsuarioInexistente`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      expect(response.status).toBe(404); // not found

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "Usuário não encontrado.",
        action: "Verifique se o username informado está correto.",
        status_code: 404,
      });
    });
  });
});
