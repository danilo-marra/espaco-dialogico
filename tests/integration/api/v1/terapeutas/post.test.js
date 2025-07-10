import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";
import {
  ensureDevAdminExists,
  prepareAuthentication,
} from "tests/helpers/auth.js";
import {
  ensureServerRunning,
  cleanupServer,
} from "tests/helpers/serverManager.js";

// Use environment variables for port configuration
const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT || 3000;

const TEST_NAME = "POST /api/v1/terapeutas";

describe("POST /api/v1/terapeutas", () => {
  let authToken;

  beforeAll(async () => {
    // Garantir que o servidor está rodando (inicia apenas se necessário)
    await ensureServerRunning(TEST_NAME, port);
    await orchestrator.waitForAllServices();
    await orchestrator.clearDatabase();
    await orchestrator.runPendingMigrations();
    // Agora, o admin de desenvolvimento pode ser criado com segurança
    await ensureDevAdminExists();
    // E a autenticação pode ser preparada
    authToken = await prepareAuthentication(port);
  });

  afterAll(() => {
    // Limpar apenas se fomos nós que iniciamos o servidor
    cleanupServer(TEST_NAME);
  });

  describe("Usuário autenticado", () => {
    // O primeiro teste deve verificar se temos um token válido antes de continuar
    test("Authentication setup is successful", async () => {
      // Verificar se temos um token válido
      expect(authToken).toBeTruthy();
    });

    test("Com token válido e dados completos", async () => {
      // Verificar se temos um token de autenticação
      expect(authToken).toBeTruthy();

      const timestamp = Date.now();

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
            email: `julianabarbosa.psi.${timestamp}@gmail.com`,
            crp: "CRP 06/12345",
            dt_nascimento: "1985-03-15",
            dt_entrada: "2025-02-22T03:00:00.000Z",
            chave_pix: "pix871",
          }),
        },
      );

      expect(response.status).toBe(201); // created

      const responseBody = await response.json();

      // Validar a estrutura básica primeiro
      expect(responseBody).toMatchObject({
        nome: "Juliana Barbosa",
        foto: null,
        telefone: "61992095674",
        email: `julianabarbosa.psi.${timestamp}@gmail.com`,
        crp: "CRP 06/12345",
        curriculo_arquivo: null,
        dt_entrada: "2025-02-22T03:00:00.000Z",
        chave_pix: "pix871",
        user_id: null,
      });

      // Validar que a data de nascimento contém a data correta, independente do timezone
      expect(responseBody.dt_nascimento).toMatch(
        /^1985-03-15T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );

      // Validar que a data contém a data correta (1985-03-15)
      expect(responseBody.dt_nascimento).toContain("1985-03-15");

      // Validar os campos obrigatórios
      expect(responseBody.id).toBeDefined();
      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(responseBody.created_at).toBeDefined();
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(responseBody.updated_at).toBeDefined();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test("Com email duplicado", async () => {
      const timestamp = Date.now();
      const duplicateEmail = `duplicado.${timestamp}@gmail.com`;

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
            email: duplicateEmail,
            crp: null,
            dt_nascimento: null,
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
            email: duplicateEmail,
            crp: null,
            dt_nascimento: null,
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
      const timestamp = Date.now();

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
            email: `semauth.${timestamp}@gmail.com`,
            crp: null,
            dt_nascimento: null,
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
