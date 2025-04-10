import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";

// Use environment variables for port configuration
const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT || 3000;

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/sessions", () => {
  describe("User authentication", () => {
    test("Successful login with valid email, password, and MFA token", async () => {
      // Create a user
      const userResponse = await fetch(`http://localhost:${port}/api/v1/users`, {
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

      expect(userResponse.status).toBe(201); // created

      const user = await userResponse.json();

      // Generate MFA secret for the user
      const mfaSecretResponse = await fetch(`http://localhost:${port}/api/v1/users/${user.id}/mfa-secret`, {
        method: "POST",
      });

      expect(mfaSecretResponse.status).toBe(200); // OK

      const { mfaSecret } = await mfaSecretResponse.json();

      // Generate a valid MFA token
      const mfaToken = speakeasy.totp({
        secret: mfaSecret,
        encoding: "base32",
      });

      // Attempt to login
      const loginResponse = await fetch(`http://localhost:${port}/api/v1/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "contato@john_doe.com",
          password: "senha123",
          mfaToken,
        }),
      });

      expect(loginResponse.status).toBe(200); // OK

      const loginResponseBody = await loginResponse.json();
      expect(loginResponseBody).toEqual({
        message: "Login successful",
      });
    });

    test("Failed login with invalid email or password", async () => {
      // Attempt to login with invalid email
      const invalidEmailResponse = await fetch(`http://localhost:${port}/api/v1/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "invalid@john_doe.com",
          password: "senha123",
        }),
      });

      expect(invalidEmailResponse.status).toBe(401); // Unauthorized

      const invalidEmailResponseBody = await invalidEmailResponse.json();
      expect(invalidEmailResponseBody).toEqual({
        error: "Invalid email or password. Please try again.",
      });

      // Attempt to login with invalid password
      const invalidPasswordResponse = await fetch(`http://localhost:${port}/api/v1/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "contato@john_doe.com",
          password: "invalid_password",
        }),
      });

      expect(invalidPasswordResponse.status).toBe(401); // Unauthorized

      const invalidPasswordResponseBody = await invalidPasswordResponse.json();
      expect(invalidPasswordResponseBody).toEqual({
        error: "Invalid email or password. Please try again.",
      });
    });

    test("Failed login with invalid MFA token", async () => {
      // Create a user
      const userResponse = await fetch(`http://localhost:${port}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "jane_doe",
          email: "contato@jane_doe.com",
          password: "senha123",
        }),
      });

      expect(userResponse.status).toBe(201); // created

      const user = await userResponse.json();

      // Generate MFA secret for the user
      const mfaSecretResponse = await fetch(`http://localhost:${port}/api/v1/users/${user.id}/mfa-secret`, {
        method: "POST",
      });

      expect(mfaSecretResponse.status).toBe(200); // OK

      const { mfaSecret } = await mfaSecretResponse.json();

      // Attempt to login with invalid MFA token
      const loginResponse = await fetch(`http://localhost:${port}/api/v1/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "contato@jane_doe.com",
          password: "senha123",
          mfaToken: "invalid_token",
        }),
      });

      expect(loginResponse.status).toBe(401); // Unauthorized

      const loginResponseBody = await loginResponse.json();
      expect(loginResponseBody).toEqual({
        error: "Invalid MFA token. Please try again.",
      });
    });
  });
});
