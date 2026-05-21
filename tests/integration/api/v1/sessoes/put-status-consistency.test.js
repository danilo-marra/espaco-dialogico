import { prepareAuthentication } from "tests/helpers/auth.js";
import {
  cleanupSessaoIntegrationTest,
  createPacienteFixture,
  createSessaoFixture,
  createTerapeutaFixture,
  setupSessaoIntegrationTest,
} from "tests/integration/api/v1/sessoes/fixtures.js";

const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT || 3000;
const TEST_NAME = "PUT session payment consistency";

afterAll(() => {
  cleanupSessaoIntegrationTest(TEST_NAME);
});

beforeAll(async () => {
  await setupSessaoIntegrationTest(TEST_NAME, port);
});

describe("PUT /api/v1/sessoes/[id] - consistencia", () => {
  test("deve manter notaFiscal intacta ao alternar pagamentoRealizado", async () => {
    const adminToken = await prepareAuthentication(port);
    const uniqueSuffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const terapeutaFixture = await createTerapeutaFixture(`CS-${uniqueSuffix}`);
    const pacienteFixture = await createPacienteFixture(
      terapeutaFixture.id,
      `CS-${uniqueSuffix}`,
    );
    const sessaoExistente = await createSessaoFixture({
      terapeutaId: terapeutaFixture.id,
      pacienteId: pacienteFixture.id,
      pagamentoRealizado: false,
      notaFiscal: "Emitida",
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
    expect(updatedSessao.notaFiscal).toBe("Emitida");

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
    expect(persistedSessao.notaFiscal).toBe("Emitida");
  });

  test("deve aplicar last-write-wins em duas atualizacoes quase simultaneas", async () => {
    const adminToken = await prepareAuthentication(port);
    const uniqueSuffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const terapeutaFixture = await createTerapeutaFixture(`CC-${uniqueSuffix}`);
    const pacienteFixture = await createPacienteFixture(
      terapeutaFixture.id,
      `CC-${uniqueSuffix}`,
    );
    const sessaoExistente = await createSessaoFixture({
      terapeutaId: terapeutaFixture.id,
      pacienteId: pacienteFixture.id,
      pagamentoRealizado: false,
      notaFiscal: "Não Emitida",
    });

    const requestA = fetch(
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

    const requestB = fetch(
      `http://localhost:${port}/api/v1/sessoes/${sessaoExistente.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ pagamentoRealizado: false }),
      },
    );

    const [responseA, responseB] = await Promise.all([requestA, requestB]);
    expect(responseA.status).toBe(200);
    expect(responseB.status).toBe(200);

    const bodyA = await responseA.json();
    const bodyB = await responseB.json();

    const updatedAtA = new Date(bodyA.updated_at).getTime();
    const updatedAtB = new Date(bodyB.updated_at).getTime();

    const latestBody = updatedAtA >= updatedAtB ? bodyA : bodyB;

    const getResponse = await fetch(
      `http://localhost:${port}/api/v1/sessoes/${sessaoExistente.id}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${adminToken}` },
      },
    );

    expect(getResponse.status).toBe(200);
    const persistedSessao = await getResponse.json();
    const expectedPagamentoValues =
      updatedAtA === updatedAtB
        ? [bodyA.pagamentoRealizado, bodyB.pagamentoRealizado]
        : [latestBody.pagamentoRealizado];

    expect(expectedPagamentoValues).toContain(
      persistedSessao.pagamentoRealizado,
    );
  });
});
