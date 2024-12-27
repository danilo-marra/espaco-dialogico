import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("GET /api/v1/terapeutas", () => {
  describe("Anonymous user", () => {
    test("Retrieving current terapeutas endpoint status", async () => {
      const response = await fetch("http://localhost:3000/api/v1/terapeutas");
      expect(response.status).toBe(200);
    });
  });
});
