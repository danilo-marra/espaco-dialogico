import { prepareAuthentication } from "tests/helpers/auth.js";
import {
  cleanupSessaoIntegrationTest,
  createPacienteFixture,
  createSessaoFixture,
  createTerapeutaFixture,
  setupSessaoIntegrationTest,
} from "tests/integration/api/v1/sessoes/fixtures.js";

const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT || 3000;
const TEST_NAME = "PUT session payment success";

afterAll(() => {
  cleanupSessaoIntegrationTest(TEST_NAME);
});

beforeAll(async () => {
  await setupSessaoIntegrationTest(TEST_NAME, port);
});

describe("PUT /api/v1/sessoes/[id] - sucesso", () => {
  test("deve atualizar pagamentoRealizado e manter o valor persistido", async () => {
    const adminToken = await prepareAuthentication(port);
    const uniqueSuffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const terapeutaFixture = await createTerapeutaFixture(`SU-${uniqueSuffix}`);
    const pacienteFixture = await createPacienteFixture(
      terapeutaFixture.id,
      `SU-${uniqueSuffix}`,
    );
    const sessaoExistente = await createSessaoFixture({
      terapeutaId: terapeutaFixture.id,
      pacienteId: pacienteFixture.id,
      pagamentoRealizado: false,
    });

    const updateResponse = await fetch(
      `http://localhost:${port}/api/v1/sessoes/${sessaoExistente.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ pagamentoRealizado: true }),
      },
    );

    expect(updateResponse.status).toBe(200);
    const updatedSessao = await updateResponse.json();
    expect(updatedSessao.pagamentoRealizado).toBe(true);

    const getResponse = await fetch(
      `http://localhost:${port}/api/v1/sessoes/${sessaoExistente.id}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${adminToken}` },
      },
    );

    expect(getResponse.status).toBe(200);
    const persistedSessao = await getResponse.json();
    expect(persistedSessao.pagamentoRealizado).toBe(true);
  });
});
