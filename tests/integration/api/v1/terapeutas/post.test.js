import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("POST /api/v1/terapeutas", () => {
  describe("Anonymous user", () => {
    test("Testing MethodNowAllowed", async () => {
      const response = await fetch("http://localhost:3000/api/v1/terapeutas", {
        method: "POST",
      });
      expect(response.status).toBe(405);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "MethodNotAllowedError",
        message: 'Método "POST" não permitido para este endpoint.',
        action:
          "Verifique se o método HTTP enviado é válido para este endpoint.",
        status_code: 405,
      });
    });
  });
});
