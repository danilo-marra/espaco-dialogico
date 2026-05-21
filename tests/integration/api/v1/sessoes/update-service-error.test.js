jest.mock("infra/database.js", () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  },
}));

import database from "infra/database.js";
import sessao from "models/sessao.js";

describe("models/sessao.update", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("deve converter falha inesperada do banco em ServiceError", async () => {
    database.query
      .mockResolvedValueOnce({
        rowCount: 1,
        rows: [
          {
            id: "sessao-1",
            terapeuta_id: "terapeuta-1",
            paciente_id: "paciente-1",
            agendamento_id: null,
            tipo_sessao: "Atendimento",
            valor_sessao: 150,
            valor_repasse: null,
            repasse_realizado: false,
            pagamento_realizado: false,
            nota_fiscal: "Não Emitida",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      })
      .mockRejectedValueOnce(new Error("database offline"));

    await expect(
      sessao.update("sessao-inexistente", { pagamentoRealizado: true }),
    ).rejects.toMatchObject({
      name: "ServiceError",
      statusCode: 503,
    });
  });
});
