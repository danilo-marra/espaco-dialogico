const fetch = require("node-fetch");
const orchestrator = require("tests/orchestrator.js").default;
const {
  ensureServerRunning,
  cleanupServer,
  waitForServerReady,
} = require("tests/helpers/serverManager.js");
const {
  ensureDevAdminExists,
  prepareAuthentication,
} = require("tests/helpers/auth.js");
const terapeutaModel = require("models/terapeuta.js").default;
const pacienteModel = require("models/paciente.js").default;
const sessaoModel = require("models/sessao.js").default;
const userModel = require("models/user.js").default;
const userSession = require("models/userSession.js").default;
const { generateToken } = require("utils/auth.js");

const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT || 3000;
const TEST_NAME = "Sessões - GET com autorização";
const BASE_URL = `http://localhost:${port}/api/v1/sessoes`;

let adminToken;
let ownerToken;
let intruderToken;
let sessaoId;

async function createTherapistToken(label) {
  const suffix = `${Date.now().toString().slice(-6)}${label.slice(0, 3)}`;
  const user = await userModel.create({
    username: `t_${label}_${suffix}`.slice(0, 30),
    email: `t_${label}_${suffix}@t.co`,
    password: `TestPass${suffix}!`,
    role: "terapeuta",
  });

  await userSession.deleteAllByUserId(user.id);
  const tokenVersion = await userModel.incrementTokenVersion(user.id);
  const session = await userSession.create(user.id);

  return {
    token: generateToken({
      sessionId: session.token,
      userId: user.id,
      tokenVersion,
    }),
    userId: user.id,
  };
}

beforeAll(async () => {
  await ensureServerRunning(TEST_NAME, port);
  await orchestrator.waitForAllServices();
  await waitForServerReady(port);
  await orchestrator.clearDatabase();
  await ensureDevAdminExists();

  adminToken = await prepareAuthentication(port);
  const owner = await createTherapistToken("owner");
  const intruder = await createTherapistToken("intruder");

  ownerToken = owner.token;
  intruderToken = intruder.token;

  const suffix = Date.now();

  const ownerTerapeuta = await terapeutaModel.create({
    nome: `Terapeuta Dono ${suffix}`,
    telefone: "11999990001",
    email: `terapeuta.dono.${suffix}@teste.com`,
    crp: `CRP-${suffix}`,
    dt_nascimento: "1990-01-01",
    dt_entrada: "2024-01-01",
    chave_pix: "pix-dono",
    user_id: owner.userId,
  });

  await terapeutaModel.create({
    nome: `Terapeuta Intruso ${suffix}`,
    telefone: "11999990002",
    email: `terapeuta.intruso.${suffix}@teste.com`,
    crp: `CRP-I-${suffix}`,
    dt_nascimento: "1991-01-01",
    dt_entrada: "2024-01-01",
    chave_pix: "pix-intruso",
    user_id: intruder.userId,
  });

  const paciente = await pacienteModel.create({
    nome: `Paciente Sessão ${suffix}`,
    dt_nascimento: "2010-01-01",
    terapeuta_id: ownerTerapeuta.id,
    nome_responsavel: "Responsável Sessão",
    telefone_responsavel: "11988887777",
    origem: "Indicação",
    dt_entrada: "2024-01-01",
    nf_nome_completo: "Responsável Sessão",
    nf_telefone: "11988887777",
    nf_cpf: "12345678909",
    nf_email: `responsavel.sessao.${suffix}@teste.com`,
    nf_endereco: "Rua Sessão, 123",
    nf_dt_entrada: "2024-01-01",
  });

  const sessao = await sessaoModel.create({
    terapeuta_id: ownerTerapeuta.id,
    paciente_id: paciente.id,
    tipoSessao: "Atendimento",
    valorSessao: 150,
    pagamento_realizado: false,
    repasse_realizado: false,
  });

  sessaoId = sessao.id;
});

afterAll(() => {
  cleanupServer(TEST_NAME);
});

describe("GET /api/v1/sessoes/[id] - autorização", () => {
  test("deve retornar 200 para admin", async () => {
    const response = await fetch(`${BASE_URL}/${sessaoId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty("id", sessaoId);
    expect(body).toHaveProperty("terapeuta_id");
    expect(body).toHaveProperty("paciente_id");
    expect(body).toHaveProperty("notaFiscal", "Não Emitida");
    expect(body).toHaveProperty("pagamentoRealizado", false);
  });

  test("deve retornar 200 para terapeuta dono da sessão", async () => {
    const response = await fetch(`${BASE_URL}/${sessaoId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${ownerToken}`,
      },
    });

    expect(response.status).toBe(200);
  });

  test("deve retornar 403 para terapeuta sem acesso à sessão", async () => {
    const response = await fetch(`${BASE_URL}/${sessaoId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${intruderToken}`,
      },
    });

    expect(response.status).toBe(403);

    const body = await response.json();
    expect(body.error).toBe("Acesso negado");
  });

  test("deve retornar 401 sem autenticação", async () => {
    const response = await fetch(`${BASE_URL}/${sessaoId}`, {
      method: "GET",
    });

    expect(response.status).toBe(401);
  });
});
