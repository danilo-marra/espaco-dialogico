import {
  createUserDirectlyAndLogin,
  prepareAuthentication,
} from "tests/helpers/auth.js";
import {
  cleanupSessaoIntegrationTest,
  createPacienteFixture,
  createSessaoFixture,
  createTerapeutaFixture,
  setupSessaoIntegrationTest,
} from "tests/integration/api/v1/sessoes/fixtures.js";

const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT || 3000;
const TEST_NAME = "PUT session payment errors";

afterAll(() => {
  cleanupSessaoIntegrationTest(TEST_NAME);
});

beforeAll(async () => {
  await setupSessaoIntegrationTest(TEST_NAME, port);
});

describe("PUT /api/v1/sessoes/[id] - erros", () => {
  test("deve retornar 403 para terapeuta sem permissao", async () => {
    const therapistToken = await createUserDirectlyAndLogin(port, {
      role: "terapeuta",
    });
    const uniqueSuffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const terapeutaFixture = await createTerapeutaFixture(`ER-${uniqueSuffix}`);
    const pacienteFixture = await createPacienteFixture(
      terapeutaFixture.id,
      `ER-${uniqueSuffix}`,
    );
    const sessaoExistente = await createSessaoFixture({
      terapeutaId: terapeutaFixture.id,
      pacienteId: pacienteFixture.id,
    });

    const updateResponse = await fetch(
      `http://localhost:${port}/api/v1/sessoes/${sessaoExistente.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${therapistToken}`,
        },
        body: JSON.stringify({ pagamentoRealizado: true }),
      },
    );

    expect(updateResponse.status).toBe(403);
    const errorBody = await updateResponse.json();
    expect(errorBody.error).toBe("Acesso negado");
  });

  test("deve retornar 404 quando a sessao nao existir", async () => {
    const adminToken = await prepareAuthentication(port);

    const updateResponse = await fetch(
      `http://localhost:${port}/api/v1/sessoes/00000000-0000-0000-0000-000000000000`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ pagamentoRealizado: true }),
      },
    );

    expect(updateResponse.status).toBe(404);
    const errorBody = await updateResponse.json();
    expect(errorBody.name).toBe("NotFoundError");
  });

  test("deve retornar 500 para erro interno de persistencia", async () => {
    const adminToken = await prepareAuthentication(port);

    const updateResponse = await fetch(
      `http://localhost:${port}/api/v1/sessoes/id-invalido`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ pagamentoRealizado: true }),
      },
    );

    expect(updateResponse.status).toBe(500);
  });
});
