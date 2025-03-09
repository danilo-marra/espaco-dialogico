import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("GET /api/v1/terapeutas", () => {
  describe("Anonymous user", () => {
    test("Retrieving terapeutas", async () => {
      const response = await fetch("http://localhost:3000/api/v1/terapeutas");
      expect(response.status).toBe(200);

      const responseBody = await response.json();
      responseBody.forEach((terapeuta) => {
        expect(terapeuta).toEqual({
          id: terapeuta.id,
          nome: terapeuta.nome,
          foto: terapeuta.foto,
          telefone: terapeuta.telefone,
          email: terapeuta.email,
          endereco: terapeuta.endereco,
          dt_entrada: terapeuta.dt_entrada,
          chave_pix: terapeuta.chave_pix,
          created_at: terapeuta.created_at,
          updated_at: terapeuta.updated_at,
        });

        expect(Date.parse(terapeuta.created_at)).not.toBeNaN();
        expect(Date.parse(terapeuta.updated_at)).not.toBeNaN();
      });
    });
  });
});
