import { version as uuidVersion } from "uuid";
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

describe("POST /api/v1/terapeutas", () => {
  describe("Usuário autenticado", () => {
    test("Com token válido e dados completos", async () => {
      // Verificar se temos um token de autenticação
      expect(authToken).toBeTruthy();

      const response = await fetch(
        `http://localhost:${port}/api/v1/terapeutas`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            nome: "Juliana Barbosa",
            foto: null,
            telefone: "61992095674",
            email: "julianabarbosa.psi@gmail.com",
            endereco: "shces 301 bloco c apt 202",
            dt_entrada: "2025-02-22T03:00:00.000Z",
            chave_pix: "pix871",
          }),
        },
      );

      expect(response.status).toBe(201); // created

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        nome: "Juliana Barbosa",
        foto: null,
        telefone: "61992095674",
        email: "julianabarbosa.psi@gmail.com",
        endereco: "shces 301 bloco c apt 202",
        dt_entrada: "2025-02-22T03:00:00.000Z",
        chave_pix: "pix871",
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test("Com email duplicado", async () => {
      const response1 = await fetch(
        `http://localhost:${port}/api/v1/terapeutas`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            nome: "Juliana Barbosa1",
            foto: null,
            telefone: "61992095674",
            email: "duplicado@gmail.com",
            endereco: "shces 301 bloco c apt 202",
            dt_entrada: "2025-02-22T03:00:00.000Z",
            chave_pix: "pix871",
          }),
        },
      );

      expect(response1.status).toBe(201); // created

      const response2 = await fetch(
        `http://localhost:${port}/api/v1/terapeutas`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            nome: "Juliana Barbosa2",
            foto: null,
            telefone: "61992095674",
            email: "duplicado@gmail.com",
            endereco: "shces 301 bloco c apt 202",
            dt_entrada: "2025-02-22T03:00:00.000Z",
            chave_pix: "pix871",
          }),
        },
      );

      expect(response2.status).toBe(400); // bad request

      const response2Body = await response2.json();
      expect(response2Body).toEqual({
        name: "ValidationError",
        message: "O email informado já está sendo utilizado.",
        action: "Utilize outro email para realizar o cadastro.",
        status_code: 400,
      });
    });
  });

  describe("Usuário não autenticado", () => {
    test("Tentativa sem autenticação", async () => {
      const response = await fetch(
        `http://localhost:${port}/api/v1/terapeutas`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nome: "Terapeuta Sem Auth",
            foto: null,
            telefone: "61992095674",
            email: "semauth@gmail.com",
            endereco: "shces 301 bloco c apt 202",
            dt_entrada: "2025-02-22T03:00:00.000Z",
            chave_pix: "pix871",
          }),
        },
      );

      expect(response.status).toBe(401); // Unauthorized

      const responseBody = await response.json();
      expect(responseBody.error).toBe("Token de autenticação não fornecido");
    });
  });
});
