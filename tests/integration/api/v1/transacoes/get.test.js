import orchestrator from "tests/orchestrator.js";

const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT || 3000;

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("GET /api/v1/transacoes", () => {
  // Limpar banco e recriar estrutura antes de cada teste
  beforeEach(async () => {
    await orchestrator.clearDatabase();
    await orchestrator.runPendingMigrations();
  });

  describe("Anonymous user", () => {
    test("With no data", async () => {
      const response = await fetch(
        `http://localhost:${port}/api/v1/transacoes`,
      );

      expect(response.status).toBe(401);
    });
  });
});
