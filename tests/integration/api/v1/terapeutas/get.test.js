import orchestrator from "tests/orchestrator.js";
import {
  ensureDevAdminExists,
  prepareAuthentication,
} from "tests/helpers/auth.js";

// Use environment variables for port configuration
const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT || 3000;

// Variável para armazenar o token de autenticação
let authToken = null;

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  // Agora, o admin de desenvolvimento pode ser criado com segurança
  await ensureDevAdminExists();
  // E a autenticação pode ser preparada
  authToken = await prepareAuthentication(port);
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
          crp: terapeuta.crp,
          dt_nascimento: terapeuta.dt_nascimento,
          curriculo: terapeuta.curriculo,
          dt_entrada: terapeuta.dt_entrada,
          chave_pix: terapeuta.chave_pix,
          user_id: terapeuta.user_id,
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
      expect(responseBody.error).toBe("Token de autenticação não fornecido");
    });
  });
});
