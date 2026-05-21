import database from "infra/database.js";
import sessao from "models/sessao.js";
import {
  cleanupSessaoIntegrationTest,
  createPacienteFixture,
  createSessaoFixture,
  createTerapeutaFixture,
  setupSessaoIntegrationTest,
} from "tests/integration/api/v1/sessoes/fixtures.js";

const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT || 3000;
const TEST_NAME = "models/sessao.update - service error";

let sessaoExistente;

beforeAll(async () => {
  await setupSessaoIntegrationTest(TEST_NAME, port);

  const uniqueSuffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const terapeutaFixture = await createTerapeutaFixture(`UE-${uniqueSuffix}`);
  const pacienteFixture = await createPacienteFixture(
    terapeutaFixture.id,
    `UE-${uniqueSuffix}`,
  );

  sessaoExistente = await createSessaoFixture({
    terapeutaId: terapeutaFixture.id,
    pacienteId: pacienteFixture.id,
  });
});

afterAll(() => {
  cleanupSessaoIntegrationTest(TEST_NAME);
});

describe("models/sessao.update", () => {
  test("deve converter falha inesperada do banco em ServiceError", async () => {
    const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const functionName = `force_sessao_update_error_${suffix}`.slice(0, 63);
    const triggerName = `force_sessao_update_error_trigger_${suffix}`.slice(
      0,
      63,
    );

    await database.query({
      text: `
        CREATE OR REPLACE FUNCTION ${functionName}()
        RETURNS trigger AS $$
        BEGIN
          RAISE EXCEPTION 'forced persistence failure';
        END;
        $$ LANGUAGE plpgsql;
      `,
    });

    await database.query({
      text: `
        CREATE TRIGGER ${triggerName}
        BEFORE UPDATE ON sessoes
        FOR EACH ROW
        WHEN (NEW.id = '${sessaoExistente.id}')
        EXECUTE FUNCTION ${functionName}();
      `,
    });

    try {
      await expect(
        sessao.update(sessaoExistente.id, { pagamentoRealizado: true }),
      ).rejects.toMatchObject({
        name: "ServiceError",
        statusCode: 503,
      });
    } finally {
      await database.query({
        text: `DROP TRIGGER IF EXISTS ${triggerName} ON sessoes;`,
      });
      await database.query({
        text: `DROP FUNCTION IF EXISTS ${functionName}();`,
      });
    }
  });
});
