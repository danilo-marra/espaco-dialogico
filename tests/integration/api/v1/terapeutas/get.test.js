import orchestrator from "tests/orchestrator.js";
import database from "infra/database.js";

// Use environment variables for port configuration
const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT || 3000;

// Variável para armazenar o token de autenticação
let authToken = null;

// Função auxiliar para criar um convite
async function createInvite(email = null, role = "admin") {
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

// Função auxiliar para preparar autenticação
async function prepareAuthentication() {
  try {
    // 1. Criar um convite de administrador
    const invite = await createInvite(null, "admin");

    // 2. Criar um usuário admin para o teste
    const timestamp = Date.now();
    const createUserResponse = await fetch(
      `http://localhost:${port}/api/v1/users`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: `admin_${timestamp}`,
          email: `admin_${timestamp}@example.com`,
          password: "Senha@123",
          inviteCode: invite.code,
        }),
      },
    );

    if (!createUserResponse.ok) {
      console.error("Falha ao criar usuário:", await createUserResponse.json());
      return null;
    }

    // 3. Fazer login para obter o token
    const loginResponse = await fetch(
      `http://localhost:${port}/api/v1/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: `admin_${timestamp}@example.com`,
          password: "Senha@123",
        }),
      },
    );

    if (!loginResponse.ok) {
      console.error("Falha ao fazer login:", await loginResponse.json());
      return null;
    }

    const loginData = await loginResponse.json();
    return loginData.token;
  } catch (error) {
    console.error("Erro ao preparar autenticação:", error);
    return null;
  }
}

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();

  // Obter token de autenticação para os testes
  authToken = await prepareAuthentication();
});

describe("GET /api/v1/terapeutas", () => {
  describe("Usuário autenticado", () => {
    test("Recuperando terapeutas com autenticação", async () => {
      // Verificar se temos um token de autenticação
      expect(authToken).toBeTruthy();

      const response = await fetch(
        `http://localhost:${port}/api/v1/terapeutas`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(Array.isArray(responseBody)).toBe(true);

      // Verificar a estrutura dos dados para cada terapeuta retornado
      responseBody.forEach((terapeuta) => {
        expect(terapeuta).toEqual({
          id: terapeuta.id,
          nome: terapeuta.nome,
          foto: terapeuta.foto,
          telefone: terapeuta.telefone,
          email: terapeuta.email,
          endereco: terapeuta.endereco,
          dt_entrada: terapeuta.dt_entrada,
          chave_pix: terapeuta.chave_pix,
          created_at: terapeuta.created_at,
          updated_at: terapeuta.updated_at,
        });

        expect(Date.parse(terapeuta.created_at)).not.toBeNaN();
        expect(Date.parse(terapeuta.updated_at)).not.toBeNaN();
      });
    });
  });

  describe("Usuário não autenticado", () => {
    test("Tentativa sem autenticação", async () => {
      const response = await fetch(
        `http://localhost:${port}/api/v1/terapeutas`,
      );

      expect(response.status).toBe(401); // Unauthorized

      const responseBody = await response.json();
      expect(responseBody.error).toBe("Não autorizado");
    });
  });
});
