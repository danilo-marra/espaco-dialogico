import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/users", () => {
  describe("Anonymous user", () => {
    test("With no data", async () => {
      const response = await fetch("http://localhost:3000/api/v1/users");

      expect(response.status).toBe(405); // method not allowed
    });
  });
});
