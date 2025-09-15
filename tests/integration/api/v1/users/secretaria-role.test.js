import orchestrator from "tests/orchestrator.js";
import { createInvite } from "tests/helpers/auth.js";
import {
  ensureServerRunning,
  cleanupServer,
  waitForServerReady,
} from "tests/helpers/serverManager.js";

const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT || 3000;

const TEST_NAME = "SECRETARIA role assignment";

beforeAll(async () => {
  await ensureServerRunning(TEST_NAME, port);
  await orchestrator.waitForAllServices();
  await waitForServerReady(port);
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

afterAll(() => {
  cleanupServer(TEST_NAME);
});

describe("Role assignment: secretaria", () => {
  test("user created with secretaria invite has only role 'secretaria'", async () => {
    const invite = await createInvite(null, "secretaria");

    const createResponse = await fetch(
      `http://localhost:${port}/api/v1/users`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "secretaria_only",
          email: "secretaria_only@example.com",
          password: "senha123",
          inviteCode: invite.code,
        }),
      },
    );

    expect(createResponse.status).toBe(201);
    const created = await createResponse.json();

    // Verificar role retornada na criação
    expect(created.role).toBe("secretaria");

    // Se a API expõe `roles` como array, garantir que contenha apenas 'secretaria'
    const hasRolesField = Object.prototype.hasOwnProperty.call(
      created,
      "roles",
    );
    expect(hasRolesField ? Array.isArray(created.roles) : true).toBe(true);

    // Verificar que roles, se existir, tem o valor correto
    const roles = created.roles ?? [];
    expect(hasRolesField ? roles : ["secretaria"]).toEqual(["secretaria"]);

    // Alternativamente, podemos garantir que, se existir, tenha o valor correto
    expect(created.roles || ["secretaria"]).toEqual(["secretaria"]);

    // A API não deve expor a senha
    expect(created.password).toBeUndefined();
  });
});
