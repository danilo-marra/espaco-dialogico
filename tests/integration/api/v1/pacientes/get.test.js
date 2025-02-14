import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  // await orchestrator.clearDatabase();
});

describe("GET /api/v1/pacientes/", () => {
  describe("Anonymous user", () => {
    test("Retrieving pacientes endpoint status", async () => {
      const response = await fetch("http://localhost:3000/api/v1/pacientes/");
      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(Array.isArray(responseBody)).toBe(true);
    });
  });
});
