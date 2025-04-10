import orchestrator from "tests/orchestrator.js";

// Use environment variables for port configuration
const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT || 3000;

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/users", () => {
  describe("Anonymous user", () => {
    test("With no data", async () => {
      const response = await fetch(`http://localhost:${port}/api/v1/users`);

      expect(response.status).toBe(405); // method not allowed
    });
  });
});
