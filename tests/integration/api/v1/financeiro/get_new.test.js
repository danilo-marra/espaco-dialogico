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

  // Verificar se o admin das variáveis de ambiente já existe
  await ensureDevAdminExists();

  // Obter token de autenticação para os testes
  authToken = await prepareAuthentication(port);
});

describe("GET /api/v1/dashboard/financeiro-otimizado", () => {
  describe("Usuário autenticado", () => {
    test("Recuperando dados financeiros com autenticação", async () => {
      // Verificar se temos um token de autenticação
      expect(authToken).toBeTruthy();

      const response = await fetch(
        `http://localhost:${port}/api/v1/dashboard/financeiro-otimizado`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      // Verificar se a resposta tem a estrutura esperada de dados financeiros
      expect(typeof responseBody).toBe("object");
      expect(responseBody).not.toBeNull();

      // Adicione verificações específicas baseadas na estrutura de resposta do seu endpoint
      // Por exemplo, se o endpoint retorna estatísticas financeiras:
      // expect(responseBody).toHaveProperty('totalReceita');
      // expect(responseBody).toHaveProperty('totalDespesas');
      // expect(responseBody).toHaveProperty('lucroLiquido');

      // Se retorna um array de transações:
      // expect(Array.isArray(responseBody)).toBe(true);

      console.log("Resposta do endpoint financeiro:", responseBody);
    });
  });

  describe("Usuário não autenticado", () => {
    test("Usuário não autenticado deve receber 401", async () => {
      const response = await fetch(
        `http://localhost:${port}/api/v1/dashboard/financeiro-otimizado`,
      );

      expect(response.status).toBe(401);

      const responseBody = await response.json();
      expect(responseBody.error).toBe("Não autorizado");
    });
  });
});
