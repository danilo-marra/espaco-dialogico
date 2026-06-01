const fetch = require("node-fetch");
const jwt = require("jsonwebtoken");
const {
  ensureServerRunning,
  cleanupServer,
  waitForServerReady,
} = require("tests/helpers/serverManager.js");
const {
  prepareAuthentication,
  ensureDevAdminExists,
  createUserDirectlyAndLogin,
} = require("tests/helpers/auth.js");
const orchestrator = require("tests/orchestrator.js").default;
const terapeutaModel = require("models/terapeuta.js").default;
const pacienteModel = require("models/paciente.js").default;

const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT || 3000;
const TEST_NAME = "Agendamentos - GET padrão";
const BASE_URL = `http://localhost:${port}/api/v1/agendamentos/`;

let adminToken;
let terapeutaToken;
let terapeutaId;
let pacienteId;

function agendamentoPayloadBase({ pacienteId, terapeutaId, data, hora }) {
  return {
    paciente_id: pacienteId,
    terapeuta_id: terapeutaId,
    dataAgendamento: data,
    horarioAgendamento: hora,
    localAgendamento: "Sala Azul",
    modalidadeAgendamento: "Presencial",
    tipoAgendamento: "Sessão",
    valorAgendamento: 180,
    statusAgendamento: "Confirmado",
    observacoesAgendamento: "Teste GET",
  };
}

beforeAll(async () => {
  await ensureServerRunning(TEST_NAME, port);
  await orchestrator.waitForAllServices();
  await waitForServerReady(port);
  await orchestrator.clearDatabase();
  await ensureDevAdminExists();

  adminToken = await prepareAuthentication(port);
  terapeutaToken = await createUserDirectlyAndLogin(port, {
    role: "terapeuta",
  });

  const terapeutaUserId = jwt.decode(terapeutaToken).userId;
  const sufixo = Date.now();

  const terapeuta = await terapeutaModel.create({
    nome: `Terapeuta GET ${sufixo}`,
    telefone: "11999990009",
    email: `terapeuta.get.${sufixo}@teste.com`,
    dt_entrada: "2024-01-01",
    chave_pix: "chave-get",
    user_id: terapeutaUserId,
  });

  terapeutaId = terapeuta.id;

  const paciente = await pacienteModel.create({
    nome: `Paciente GET ${sufixo}`,
    dt_nascimento: "2010-01-01",
    terapeuta_id: terapeutaId,
    nome_responsavel: "Responsavel GET",
    telefone_responsavel: "11988880009",
    origem: "Indicação",
    dt_entrada: "2024-01-01",
    nf_nome_completo: "Responsavel GET",
    nf_telefone: "11988880009",
    nf_cpf: "12345678909",
    nf_email: `responsavel.get.${sufixo}@teste.com`,
    nf_endereco: "Rua GET, 900",
    nf_dt_entrada: "2024-01-01",
  });

  pacienteId = paciente.id;

  const createResponse = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify(
      agendamentoPayloadBase({
        pacienteId,
        terapeutaId,
        data: "2026-08-01",
        hora: "09:00",
      }),
    ),
  });

  if (createResponse.status !== 201) {
    const createBody = await createResponse.text();
    throw new Error(
      `Falha no setup do teste GET: status=${createResponse.status} body=${createBody}`,
    );
  }

  const secondCreateResponse = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify(
      agendamentoPayloadBase({
        pacienteId,
        terapeutaId,
        data: "2026-08-02",
        hora: "10:00",
      }),
    ),
  });

  if (secondCreateResponse.status !== 201) {
    const createBody = await secondCreateResponse.text();
    throw new Error(
      `Falha no setup do segundo agendamento GET: status=${secondCreateResponse.status} body=${createBody}`,
    );
  }
});

afterAll(() => {
  cleanupServer(TEST_NAME);
});

describe("GET /api/v1/agendamentos/ - cenário padrão", () => {
  test("Deve retornar 200 com estrutura mínima dos itens", async () => {
    const response = await fetch(BASE_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);

    const item = body[0];
    expect(item).toHaveProperty("id");
    expect(item).toHaveProperty("paciente_id");
    expect(item).toHaveProperty("terapeuta_id");
    expect(item).toHaveProperty("dataAgendamento");
    expect(item).toHaveProperty("horarioAgendamento");
  });

  test("Deve retornar 401 quando não autenticado", async () => {
    const response = await fetch(BASE_URL, {
      method: "GET",
    });

    expect(response.status).toBe(401);
  });

  test("Deve retornar 401 para token inválido", async () => {
    const response = await fetch(BASE_URL, {
      method: "GET",
      headers: {
        Authorization: "Bearer token-invalido",
      },
    });

    expect(response.status).toBe(401);
  });

  test("Deve respeitar limit e offset na listagem", async () => {
    const response = await fetch(`${BASE_URL}?limit=1&offset=1`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("x-pagination-limit")).toBe("1");
    expect(response.headers.get("x-pagination-offset")).toBe("1");
    expect(response.headers.get("x-pagination-returned")).toBe("1");

    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(1);
  });

  // eslint-disable-next-line jest/no-disabled-tests, jest/expect-expect
  test.skip("Deve retornar 403 para usuário autenticado sem permissão", async () => {
    // Atualmente o sistema só permite roles admin/secretaria/terapeuta,
    // e todas possuem permissão para o recurso agendamentos.
    // Este cenário ficará ativo caso exista uma role autenticável sem esse recurso.
  });
});
