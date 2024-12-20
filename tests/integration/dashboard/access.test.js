import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("Dashboard Page Access", () => {
  test("Accessing Dashboard Home Page", async () => {
    const response = await fetch("http://localhost:3000/dashboard");
    expect(response.status).toBe(200);

    const responseBody = await response.text();
    expect(responseBody).toContain('data-testid="menu-component"');
    expect(responseBody).toContain('data-testid="header-component"');
  });

  test("Accessing Home Page", async () => {
    const response = await fetch("http://localhost:3000/");
    expect(response.status).toBe(200);
  });

  test("Accessing Agenda Page", async () => {
    const response = await fetch("http://localhost:3000/dashboard/agenda");
    expect(response.status).toBe(200);
  });

  test("Accessing Transações Page", async () => {
    const response = await fetch("http://localhost:3000/dashboard/transacoes");
    expect(response.status).toBe(200);
  });

  test("Accessing Pacientes Page", async () => {
    const response = await fetch("http://localhost:3000/dashboard/pacientes");
    expect(response.status).toBe(200);
  });

  test("Accessing Sessões Page", async () => {
    const response = await fetch("http://localhost:3000/dashboard/sessoes");
    expect(response.status).toBe(200);
  });

  test("Accessing Terapeutas Page", async () => {
    const response = await fetch("http://localhost:3000/dashboard/terapeutas");
    expect(response.status).toBe(200);
  });
});
