const fetch = require("node-fetch");
const {
  ensureServerRunning,
  cleanupServer,
  waitForServerReady,
} = require("tests/helpers/serverManager.js");
const {
  prepareAuthentication,
  ensureDevAdminExists,
} = require("tests/helpers/auth.js");
const orchestrator = require("tests/orchestrator.js").default;
const terapeutaModel = require("models/terapeuta.js").default;
const pacienteModel = require("models/paciente.js").default;

const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT || 3000;
const TEST_NAME = "Pacientes - GET filtros e paginação";
const BASE_URL = `http://localhost:${port}/api/v1/pacientes`;

let adminToken;
let terapeutaAId;
let terapeutaBId;
let pacienteAlphaId;

beforeAll(async () => {
  await ensureServerRunning(TEST_NAME, port);
  await orchestrator.waitForAllServices();
  await waitForServerReady(port);
  await orchestrator.clearDatabase();
  await ensureDevAdminExists();

  adminToken = await prepareAuthentication(port);
  const suffix = Date.now();

  const terapeutaA = await terapeutaModel.create({
    nome: `Terapeuta Paciente A ${suffix}`,
    telefone: "11999990011",
    email: `terapeuta.paciente.a.${suffix}@teste.com`,
    dt_entrada: "2024-01-01",
    chave_pix: "chave-paciente-a",
  });

  const terapeutaB = await terapeutaModel.create({
    nome: `Terapeuta Paciente B ${suffix}`,
    telefone: "11999990012",
    email: `terapeuta.paciente.b.${suffix}@teste.com`,
    dt_entrada: "2024-01-01",
    chave_pix: "chave-paciente-b",
  });

  terapeutaAId = terapeutaA.id;
  terapeutaBId = terapeutaB.id;

  const pacienteAlpha = await createPaciente({
    nome: `Alpha Busca ${suffix}`,
    terapeutaId: terapeutaAId,
    suffix: `${suffix}a`,
  });

  await createPaciente({
    nome: `Beta Busca ${suffix}`,
    terapeutaId: terapeutaAId,
    suffix: `${suffix}b`,
  });

  await createPaciente({
    nome: `Gamma Busca ${suffix}`,
    terapeutaId: terapeutaBId,
    suffix: `${suffix}c`,
  });

  pacienteAlphaId = pacienteAlpha.id;
});

afterAll(() => {
  cleanupServer(TEST_NAME);
});

describe("GET /api/v1/pacientes - filtros e paginação", () => {
  test("deve respeitar limit e expor headers de paginação", async () => {
    const response = await fetch(`${BASE_URL}?limit=2`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("x-pagination-limit")).toBe("2");
    expect(response.headers.get("x-pagination-offset")).toBe("0");
    expect(response.headers.get("x-pagination-returned")).toBe("2");

    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(2);
  });

  test("deve filtrar por terapeuta_id", async () => {
    const response = await fetch(
      `${BASE_URL}?terapeuta_id=${terapeutaBId}&limit=10`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      },
    );

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.length).toBeGreaterThan(0);
    expect(body.every((item) => item.terapeuta_id === terapeutaBId)).toBe(true);
  });

  test("deve filtrar por busca textual", async () => {
    const response = await fetch(`${BASE_URL}?search=Alpha%20Busca&limit=10`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.some((item) => item.id === pacienteAlphaId)).toBe(true);
    expect(body.every((item) => item.nome.includes("Alpha Busca"))).toBe(true);
  });
});

async function createPaciente({ nome, terapeutaId, suffix }) {
  return pacienteModel.create({
    nome,
    dt_nascimento: "2010-01-01",
    terapeuta_id: terapeutaId,
    nome_responsavel: `Responsavel ${suffix}`,
    telefone_responsavel: "11988880009",
    origem: "Indicação",
    dt_entrada: "2024-01-01",
    nf_nome_completo: `Responsavel ${suffix}`,
    nf_telefone: "11988880009",
    nf_cpf: `${suffix}`.replace(/\D/g, "").padEnd(11, "0").slice(0, 11),
    nf_email: `responsavel.${suffix}@teste.com`,
    nf_endereco: "Rua GET, 900",
    nf_dt_entrada: "2024-01-01",
  });
}
