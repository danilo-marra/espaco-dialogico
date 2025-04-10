import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";

// Use environment variables for port configuration
const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT || 3000;

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/users", () => {
  describe("Anonymous user", () => {
    test("With unique and valid data", async () => {
      const response = await fetch(`http://localhost:${port}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "john_doe",
          email: "contato@john_doe.com",
          password: "senha123",
        }),
      });

      expect(response.status).toBe(201); // created

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "john_doe",
        email: "contato@john_doe.com",
        password: "senha123",
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });
    test("With duplicated 'email'", async () => {
      const response1 = await fetch(`http://localhost:${port}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "emailduplicado1",
          email: "duplicado@john_doe.com",
          password: "senha123",
        }),
      });

      expect(response1.status).toBe(201); // created

      const response2 = await fetch(`http://localhost:${port}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "emailduplicado2",
          email: "Duplicado@john_doe.com",
          password: "senha123",
        }),
      });

      expect(response2.status).toBe(400); // bad request

      const response2Body = await response2.json();
      expect(response2Body).toEqual({
        name: "ValidationError",
        message: "O email informado já está sendo utilizado.",
        action: "Utilize outro email para realizar o cadastro.",
        status_code: 400,
      });
      // 409 - conflict
      // 422 - unprocessable entity
      // 404 - not found
      // 401 - unauthorized
      // 403 - forbidden
    });
    test("With duplicated 'username'", async () => {
      const response1 = await fetch(`http://localhost:${port}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "usernameduplicado",
          email: "usernameduplicado1@john_doe.com",
          password: "senha123",
        }),
      });

      expect(response1.status).toBe(201); // created

      const response2 = await fetch(`http://localhost:${port}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "UsernameDuplicado",
          email: "usernameduplicado2@john_doe.com",
          password: "senha123",
        }),
      });

      expect(response2.status).toBe(400); // bad request

      const response2Body = await response2.json();
      expect(response2Body).toEqual({
        name: "ValidationError",
        message: "O username informado já está sendo utilizado.",
        action: "Utilize outro username para realizar o cadastro.",
        status_code: 400,
      });
    });
  });
});
