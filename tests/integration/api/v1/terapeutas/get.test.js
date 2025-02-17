import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("GET /api/v1/terapeutas/", () => {
  describe("Anonymous user", () => {
    test("Retrieving current terapeutas endpoint status", async () => {
      const response = await fetch("http://localhost:3000/api/v1/terapeutas/");
      expect(response.status).toBe(200);
    });

    test("Returns an array of terapeutas", async () => {
      const response = await fetch("http://localhost:3000/api/v1/terapeutas/");
      const terapeutas = await response.json();

      expect(Array.isArray(terapeutas)).toBe(true);
    });

    test("Terapeuta has correct fields", async () => {
      const response = await fetch("http://localhost:3000/api/v1/terapeutas/");
      const terapeutas = await response.json();

      expect(terapeutas.length).toBeGreaterThan(0);
      const t = terapeutas[0];
      expect(t).toHaveProperty("idTerapeuta");
      expect(t).toHaveProperty("nomeTerapeuta");
      expect(t).toHaveProperty("fotoTerapeuta");
      expect(t).toHaveProperty("telefoneTerapeuta");
      expect(t).toHaveProperty("emailTerapeuta");
      expect(t).toHaveProperty("enderecoTerapeuta");
      expect(t).toHaveProperty("dtEntradaTerapeuta");
      expect(t).toHaveProperty("chavePixTerapeuta");
    });
  });
});
