import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/terapeutas", () => {
  describe("Anonymous user", () => {
    test("With unique and valid data", async () => {
      const response = await fetch("http://localhost:3000/api/v1/terapeutas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: "Juliana Barbosa",
          foto: "aZhskasiypsq.png",
          telefone: "61992095674",
          email: "julianabarbosa.psi@gmail.com",
          endereco: "shces 301 bloco c apt 202",
          dt_entrada: "2025-02-22T03:00:00.000Z",
          chave_pix: "pix871",
        }),
      });

      expect(response.status).toBe(201); // created

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        nome: "Juliana Barbosa",
        foto: "aZhskasiypsq.png",
        telefone: "61992095674",
        email: "julianabarbosa.psi@gmail.com",
        endereco: "shces 301 bloco c apt 202",
        dt_entrada: "2025-02-22T03:00:00.000Z",
        chave_pix: "pix871",
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test("With duplicated 'email'", async () => {
      const response1 = await fetch("http://localhost:3000/api/v1/terapeutas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: "Juliana Barbosa1",
          foto: "aZhskasiypsq.png",
          telefone: "61992095674",
          email: "duplicado@gmail.com",
          endereco: "shces 301 bloco c apt 202",
          dt_entrada: "2025-02-22T03:00:00.000Z",
          chave_pix: "pix871",
        }),
      });

      expect(response1.status).toBe(201); // created

      const response2 = await fetch("http://localhost:3000/api/v1/terapeutas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: "Juliana Barbosa2",
          foto: "aZhskasiypsq.png",
          telefone: "61992095674",
          email: "duplicado@gmail.com",
          endereco: "shces 301 bloco c apt 202",
          dt_entrada: "2025-02-22T03:00:00.000Z",
          chave_pix: "pix871",
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
    });
  });
});
