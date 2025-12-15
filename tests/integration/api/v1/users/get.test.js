import orchestrator from "tests/orchestrator.js";
import {
  ensureServerRunning,
  cleanupServer,
  waitForServerReady,
} from "tests/helpers/serverManager.js";

// Use environment variables for port configuration
const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT || 3000;

const TEST_NAME = "GET /api/v1/users";

beforeAll(async () => {
  // Garantir que o servidor está rodando (inicia apenas se necessário)
  await ensureServerRunning(TEST_NAME, port);

  await orchestrator.waitForAllServices();
  await waitForServerReady(port);
  await orchestrator.clearDatabase();
});

afterAll(() => {
  // Limpar apenas se fomos nós que iniciamos o servidor
  cleanupServer(TEST_NAME);
});

describe("GET /api/v1/users", () => {
  describe("Anonymous user", () => {
    test("With no data", async () => {
      const response = await fetch(`http://localhost:${port}/api/v1/users`);

      expect(response.status).toBe(405); // method not allowed
    });
  });
});
