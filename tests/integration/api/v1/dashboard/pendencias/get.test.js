import orchestrator from "tests/orchestrator.js";
import {
  ensureServerRunning,
  cleanupServer,
  waitForServerReady,
} from "tests/helpers/serverManager.js";
import {
  prepareAuthentication,
  ensureDevAdminExists,
} from "tests/helpers/auth.js";

const port = process.env.PORT || 3000;
const TEST_NAME = "GET /api/v1/dashboard/pendencias";

beforeAll(async () => {
  await ensureServerRunning(TEST_NAME, port);
  await orchestrator.waitForAllServices();
  await waitForServerReady(port);
  await orchestrator.clearDatabase();
  await ensureDevAdminExists();
});

afterAll(() => {
  cleanupServer(TEST_NAME);
});

describe("GET /api/v1/dashboard/pendencias", () => {
  test("usuário admin deve conseguir acessar as pendências do período", async () => {
    const token = await prepareAuthentication(port);
    const response = await fetch(
      `http://localhost:${port}/api/v1/dashboard/pendencias?periodo=2026-05`,
      {
        headers: { Authorization: "Bearer " + token },
      },
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("periodo", "2026-05");
    expect(body).toHaveProperty("resumo");
    expect(body).toHaveProperty("pacientesACobrar");
    expect(body).toHaveProperty("notasFiscaisPendentes");
    expect(body).toHaveProperty("marcacoesPendentes");
    expect(body).toHaveProperty("repassesPendentes");
  });

  test("deve retornar 400 para período inválido", async () => {
    const token = await prepareAuthentication(port);
    const response = await fetch(
      `http://localhost:${port}/api/v1/dashboard/pendencias?periodo=2026/05`,
      {
        headers: { Authorization: "Bearer " + token },
      },
    );

    expect(response.status).toBe(400);
  });

  test("usuário não autenticado deve receber 401", async () => {
    const response = await fetch(
      `http://localhost:${port}/api/v1/dashboard/pendencias`,
    );
    expect(response.status).toBe(401);
  });
});
