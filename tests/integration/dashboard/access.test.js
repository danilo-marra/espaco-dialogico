import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("Dashboard Page Access", () => {
  test("Accessing Dashboard Home Page", async () => {
    const response = await fetch("http://localhost:3000/dashboard");
    expect(response.status).toBe(200);

    const responseBody = await response.text();
    expect(responseBody).toContain("Menu");
    expect(responseBody).toContain("Header");
  });

  test("Accessing Home Page", async () => {
    const response = await fetch("http://localhost:3000/");
    expect(response.status).toBe(200);

    const responseBody = await response.text();
    expect(responseBody).toContain("Home");
  });

  test("Accessing Agenda Page", async () => {
    const response = await fetch("http://localhost:3000/agenda");
    expect(response.status).toBe(200);

    const responseBody = await response.text();
    expect(responseBody).toContain("Agenda");
  });

  test("Accessing Transações Page", async () => {
    const response = await fetch("http://localhost:3000/transacoes");
    expect(response.status).toBe(200);

    const responseBody = await response.text();
    expect(responseBody).toContain("Transações");
  });

  test("Accessing Pacientes Page", async () => {
    const response = await fetch("http://localhost:3000/pacientes");
    expect(response.status).toBe(200);

    const responseBody = await response.text();
    expect(responseBody).toContain("Pacientes");
  });

  test("Accessing Sessões Page", async () => {
    const response = await fetch("http://localhost:3000/sessoes");
    expect(response.status).toBe(200);

    const responseBody = await response.text();
    expect(responseBody).toContain("Sessões");
  });

  test("Accessing Terapeutas Page", async () => {
    const response = await fetch("http://localhost:3000/terapeutas");
    expect(response.status).toBe(200);

    const responseBody = await response.text();
    expect(responseBody).toContain("Terapeutas");
  });
});
