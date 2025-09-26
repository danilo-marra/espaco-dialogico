import orchestrator from "tests/orchestrator.js";
import { createInvite } from "tests/helpers/auth.js";
import terapeuta from "models/terapeuta.js";
import paciente from "models/paciente.js";
import agendamento from "models/agendamento.js";
import sessao from "models/sessao.js";
import FormData from "form-data";
import {
  ensureServerRunning,
  cleanupServer,
  waitForServerReady,
} from "tests/helpers/serverManager.js";

const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT || 3000;

const TEST_NAME = "SECRETARIA role assignment";

beforeAll(async () => {
  await ensureServerRunning(TEST_NAME, port);
  await orchestrator.waitForAllServices();
  await waitForServerReady(port);
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

afterAll(() => {
  cleanupServer(TEST_NAME);
});

describe("Role assignment: secretaria", () => {
  test("user created with secretaria invite has only role 'secretaria'", async () => {
    const invite = await createInvite(null, "secretaria");

    const createResponse = await fetch(
      `http://localhost:${port}/api/v1/users`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "secretaria_only",
          email: "secretaria_only@example.com",
          password: "senha123",
          inviteCode: invite.code,
        }),
      },
    );

    expect(createResponse.status).toBe(201);
    const created = await createResponse.json();

    // Verificar role retornada na criação
    expect(created.role).toBe("secretaria");

    // Se a API expõe `roles` como array, garantir que contenha apenas 'secretaria'
    const hasRolesField = Object.prototype.hasOwnProperty.call(
      created,
      "roles",
    );
    expect(hasRolesField ? Array.isArray(created.roles) : true).toBe(true);

    // Verificar que roles, se existir, tem o valor correto
    const roles = created.roles ?? [];
    expect(hasRolesField ? roles : ["secretaria"]).toEqual(["secretaria"]);

    // Alternativamente, podemos garantir que, se existir, tenha o valor correto
    expect(created.roles || ["secretaria"]).toEqual(["secretaria"]);

    // A API não deve expor a senha
    expect(created.password).toBeUndefined();
  });

  test("user created with secretaria role can access secretaria routes", async () => {
    const invite = await createInvite(null, "secretaria");
    const createResponse = await fetch(
      `http://localhost:${port}/api/v1/users`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "secretaria_access",
          email: "secretaria_access@example.com",
          password: "senha123",
          inviteCode: invite.code,
        }),
      },
    );

    expect(createResponse.status).toBe(201);
    const created = await createResponse.json();
    expect(created.role).toBe("secretaria");

    // Login para obter token
    const loginResponse = await fetch(
      `http://localhost:${port}/api/v1/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "secretaria_access@example.com",
          password: "senha123",
        }),
      },
    );

    expect(loginResponse.status).toBe(200);
    const loginData = await loginResponse.json();
    const token = loginData.token;
    expect(token).toBeDefined();

    // Testar acesso a uma rota de secretaria
    const secretariaRouteResponse = await fetch(
      `http://localhost:${port}/api/v1/pacientes`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    expect(secretariaRouteResponse.status).toBe(200);
    const secretariaData = await secretariaRouteResponse.json();
    expect(secretariaData).toBeDefined();
  });

  test("secretaria pode visualizar e criar agendamentos para qualquer terapeuta", async () => {
    const uniqueSuffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const password = "senha123";
    const secretariaEmail = `secretaria_${uniqueSuffix}@example.com`;
    const secretariaUsername = `sec_ag_${uniqueSuffix}`.slice(0, 30);

    const invite = await createInvite(null, "secretaria");

    const createResponse = await fetch(
      `http://localhost:${port}/api/v1/users`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: secretariaUsername,
          email: secretariaEmail,
          password,
          inviteCode: invite.code,
        }),
      },
    );

    expect(createResponse.status).toBe(201);

    const loginResponse = await fetch(
      `http://localhost:${port}/api/v1/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: secretariaEmail,
          password,
        }),
      },
    );

    expect(loginResponse.status).toBe(200);
    const { token } = await loginResponse.json();
    expect(token).toBeDefined();

    const terapeutaA = await createTerapeutaFixture(`A-${uniqueSuffix}`);
    const terapeutaB = await createTerapeutaFixture(`B-${uniqueSuffix}`);

    const pacienteA = await createPacienteFixture(
      terapeutaA.id,
      `A-${uniqueSuffix}`,
    );
    const pacienteB = await createPacienteFixture(
      terapeutaB.id,
      `B-${uniqueSuffix}`,
    );

    await createAgendamentoFixture({
      terapeutaId: terapeutaA.id,
      pacienteId: pacienteA.id,
      date: "2025-01-10",
      time: "09:00",
    });

    await createAgendamentoFixture({
      terapeutaId: terapeutaB.id,
      pacienteId: pacienteB.id,
      date: "2025-01-11",
      time: "11:00",
    });

    const listResponse = await fetch(
      `http://localhost:${port}/api/v1/agendamentos`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    expect(listResponse.status).toBe(200);
    const agendamentosList = await listResponse.json();
    expect(Array.isArray(agendamentosList)).toBe(true);

    const terapeutaIds = new Set(
      agendamentosList.map((item) => item.terapeuta_id),
    );
    expect(terapeutaIds.has(terapeutaA.id)).toBe(true);
    expect(terapeutaIds.has(terapeutaB.id)).toBe(true);

    const createAgendamentoResponse = await fetch(
      `http://localhost:${port}/api/v1/agendamentos`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          terapeuta_id: terapeutaB.id,
          paciente_id: pacienteB.id,
          dataAgendamento: "2025-02-01",
          horarioAgendamento: "15:00",
          localAgendamento: "Sala Azul",
          modalidadeAgendamento: "Presencial",
          tipoAgendamento: "Sessão",
          valorAgendamento: 150,
          statusAgendamento: "Confirmado",
          observacoesAgendamento: "Criado pela secretaria",
        }),
      },
    );

    expect(createAgendamentoResponse.status).toBe(201);
    const createdAgendamento = await createAgendamentoResponse.json();
    expect(createdAgendamento.terapeuta_id).toBe(terapeutaB.id);
    expect(createdAgendamento.paciente_id).toBe(pacienteB.id);
  });

  test("secretaria pode visualizar e cadastrar pacientes para qualquer terapeuta", async () => {
    const uniqueSuffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const password = "senha123";
    const secretariaEmail = `secretaria_pac_${uniqueSuffix}@example.com`;
    const secretariaUsername = `sec_pac_${uniqueSuffix}`.slice(0, 30);

    const invite = await createInvite(null, "secretaria");

    const createResponse = await fetch(
      `http://localhost:${port}/api/v1/users`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: secretariaUsername,
          email: secretariaEmail,
          password,
          inviteCode: invite.code,
        }),
      },
    );

    expect(createResponse.status).toBe(201);

    const loginResponse = await fetch(
      `http://localhost:${port}/api/v1/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: secretariaEmail,
          password,
        }),
      },
    );

    expect(loginResponse.status).toBe(200);
    const { token } = await loginResponse.json();
    expect(token).toBeDefined();

    const terapeutaA = await createTerapeutaFixture(`PA-${uniqueSuffix}`);
    const terapeutaB = await createTerapeutaFixture(`PB-${uniqueSuffix}`);

    const pacienteExistente = await createPacienteFixture(
      terapeutaB.id,
      `PB-${uniqueSuffix}`,
    );

    const listResponse = await fetch(
      `http://localhost:${port}/api/v1/pacientes`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    expect(listResponse.status).toBe(200);
    const pacientesList = await listResponse.json();
    expect(Array.isArray(pacientesList)).toBe(true);
    const pacienteIds = new Set(pacientesList.map((item) => item.id));
    expect(pacienteIds.has(pacienteExistente.id)).toBe(true);

    const formData = new FormData();
    formData.append("nome", `Paciente API ${uniqueSuffix}`);
    formData.append("terapeuta_id", String(terapeutaA.id));
    formData.append("nome_responsavel", `Responsável API ${uniqueSuffix}`);
    formData.append("telefone_responsavel", "11988886666");
    formData.append(
      "email_responsavel",
      `responsavel_api_${uniqueSuffix}@example.com`,
    );
    formData.append(
      "cpf_responsavel",
      `${uniqueSuffix}`.padEnd(11, "0").slice(0, 11),
    );
    formData.append("endereco_responsavel", "Rua Teste API, 456");
    formData.append("dt_nascimento", "2012-05-20");
    formData.append("dt_entrada", new Date().toISOString());
    formData.append("origem", "Indicação");

    const formBuffer = formData.getBuffer();
    const boundary = formData.getBoundary();

    const createPacienteResponse = await fetch(
      `http://localhost:${port}/api/v1/pacientes`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
          "Content-Length": String(formBuffer.length),
        },
        body: formBuffer,
      },
    );

    expect(createPacienteResponse.status).toBe(201);
    const pacienteCriado = await createPacienteResponse.json();
    expect(pacienteCriado.nome).toBe(`Paciente API ${uniqueSuffix}`);
    expect(Number(pacienteCriado.terapeuta_id)).toBe(Number(terapeutaA.id));
  });

  test("secretaria pode visualizar e cadastrar terapeutas", async () => {
    const uniqueSuffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const password = "senha123";
    const secretariaEmail = `secretaria_ter_${uniqueSuffix}@example.com`;
    const secretariaUsername = `sec_ter_${uniqueSuffix}`.slice(0, 30);

    const invite = await createInvite(null, "secretaria");

    const createResponse = await fetch(
      `http://localhost:${port}/api/v1/users`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: secretariaUsername,
          email: secretariaEmail,
          password,
          inviteCode: invite.code,
        }),
      },
    );

    expect(createResponse.status).toBe(201);

    const loginResponse = await fetch(
      `http://localhost:${port}/api/v1/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: secretariaEmail,
          password,
        }),
      },
    );

    expect(loginResponse.status).toBe(200);
    const { token } = await loginResponse.json();
    expect(token).toBeDefined();

    const terapeutaExistente = await createTerapeutaFixture(
      `TC-${uniqueSuffix}`,
    );

    const listResponse = await fetch(
      `http://localhost:${port}/api/v1/terapeutas`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    expect(listResponse.status).toBe(200);
    const terapeutasList = await listResponse.json();
    expect(Array.isArray(terapeutasList)).toBe(true);
    const terapeutaIds = new Set(terapeutasList.map((item) => item.id));
    expect(terapeutaIds.has(terapeutaExistente.id)).toBe(true);

    const sanitizedSuffix = uniqueSuffix.replace(/[^0-9a-z]/gi, "");
    const telefone = `1197${sanitizedSuffix}`.slice(0, 11).padEnd(11, "0");
    const crp = `CRP-${sanitizedSuffix}`.slice(0, 20);
    const pix = `pix-${sanitizedSuffix}`.slice(0, 20);

    const formData = new FormData();
    formData.append("nome", `Terapeuta API ${uniqueSuffix}`);
    formData.append("telefone", telefone);
    formData.append("email", `terapeuta_api_${uniqueSuffix}@example.com`);
    formData.append("crp", crp);
    formData.append("dt_nascimento", "1988-03-15");
    formData.append("dt_entrada", new Date().toISOString());
    formData.append("chave_pix", pix);

    const formBuffer = formData.getBuffer();
    const boundary = formData.getBoundary();

    const createTerapeutaResponse = await fetch(
      `http://localhost:${port}/api/v1/terapeutas`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
          "Content-Length": String(formBuffer.length),
        },
        body: formBuffer,
      },
    );

    expect(createTerapeutaResponse.status).toBe(201);
    const terapeutaCriado = await createTerapeutaResponse.json();
    expect(terapeutaCriado.nome).toBe(`Terapeuta API ${uniqueSuffix}`);
    expect(terapeutaCriado.email).toBe(
      `terapeuta_api_${uniqueSuffix}@example.com`,
    );
  });

  test("secretaria pode atualizar status de nota fiscal das sessões", async () => {
    const uniqueSuffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const password = "senha123";
    const secretariaEmail = `secretaria_nf_${uniqueSuffix}@example.com`;
    const secretariaUsername = `sec_nf_${uniqueSuffix}`.slice(0, 30);

    const invite = await createInvite(null, "secretaria");

    const createResponse = await fetch(
      `http://localhost:${port}/api/v1/users`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: secretariaUsername,
          email: secretariaEmail,
          password,
          inviteCode: invite.code,
        }),
      },
    );

    expect(createResponse.status).toBe(201);

    const loginResponse = await fetch(
      `http://localhost:${port}/api/v1/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: secretariaEmail,
          password,
        }),
      },
    );

    expect(loginResponse.status).toBe(200);
    const { token } = await loginResponse.json();
    expect(token).toBeDefined();

    const terapeutaFixture = await createTerapeutaFixture(`NF-${uniqueSuffix}`);
    const pacienteFixture = await createPacienteFixture(
      terapeutaFixture.id,
      `NF-${uniqueSuffix}`,
    );

    const sessaoExistente = await createSessaoFixture({
      terapeutaId: terapeutaFixture.id,
      pacienteId: pacienteFixture.id,
      tipoSessao: "Atendimento",
      valorSessao: 180,
      notaFiscal: "Não Emitida",
    });

    const updateResponse = await fetch(
      `http://localhost:${port}/api/v1/sessoes/${sessaoExistente.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          notaFiscal: "Emitida",
          pagamentoRealizado: true,
        }),
      },
    );

    expect(updateResponse.status).toBe(200);
    const sessaoAtualizada = await updateResponse.json();
    expect(sessaoAtualizada.notaFiscal).toBe("Emitida");
    expect(sessaoAtualizada.pagamentoRealizado).toBe(true);

    const getResponse = await fetch(
      `http://localhost:${port}/api/v1/sessoes/${sessaoExistente.id}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    expect(getResponse.status).toBe(200);
    const sessaoConsultada = await getResponse.json();
    expect(sessaoConsultada.notaFiscal).toBe("Emitida");
    expect(sessaoConsultada.pagamentoRealizado).toBe(true);
  });

  test("secretaria pode visualizar e registrar sessões", async () => {
    const uniqueSuffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const password = "senha123";
    const secretariaEmail = `secretaria_sess_${uniqueSuffix}@example.com`;
    const secretariaUsername = `sec_sess_${uniqueSuffix}`.slice(0, 30);

    const invite = await createInvite(null, "secretaria");

    const createResponse = await fetch(
      `http://localhost:${port}/api/v1/users`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: secretariaUsername,
          email: secretariaEmail,
          password,
          inviteCode: invite.code,
        }),
      },
    );

    expect(createResponse.status).toBe(201);

    const loginResponse = await fetch(
      `http://localhost:${port}/api/v1/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: secretariaEmail,
          password,
        }),
      },
    );

    expect(loginResponse.status).toBe(200);
    const { token } = await loginResponse.json();
    expect(token).toBeDefined();

    const terapeutaFixture = await createTerapeutaFixture(`SE-${uniqueSuffix}`);
    const pacienteFixture = await createPacienteFixture(
      terapeutaFixture.id,
      `SE-${uniqueSuffix}`,
    );

    const sessaoExistente = await createSessaoFixture({
      terapeutaId: terapeutaFixture.id,
      pacienteId: pacienteFixture.id,
      tipoSessao: "Atendimento",
      valorSessao: 200,
      notaFiscal: "Não Emitida",
      pagamentoRealizado: false,
    });

    const listResponse = await fetch(
      `http://localhost:${port}/api/v1/sessoes`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    expect(listResponse.status).toBe(200);
    const sessoesList = await listResponse.json();
    expect(Array.isArray(sessoesList)).toBe(true);
    expect(sessoesList.some((item) => item.id === sessaoExistente.id)).toBe(
      true,
    );

    const createSessaoResponse = await fetch(
      `http://localhost:${port}/api/v1/sessoes`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          terapeuta_id: terapeutaFixture.id,
          paciente_id: pacienteFixture.id,
          tipoSessao: "Avaliação",
          valorSessao: 250,
        }),
      },
    );

    expect(createSessaoResponse.status).toBe(201);
    const novaSessao = await createSessaoResponse.json();
    expect(novaSessao.terapeuta_id).toBe(terapeutaFixture.id);
    expect(novaSessao.tipoSessao).toBe("Avaliação");
    expect(novaSessao.pagamentoRealizado).toBe(false);
    expect(novaSessao.notaFiscal).toBe("Não Emitida");

    const listAfterResponse = await fetch(
      `http://localhost:${port}/api/v1/sessoes`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    expect(listAfterResponse.status).toBe(200);
    const sessoesAtualizadas = await listAfterResponse.json();
    expect(sessoesAtualizadas.some((item) => item.id === novaSessao.id)).toBe(
      true,
    );
  });

  test("secretaria não pode acessar ou enviar convites", async () => {
    const uniqueSuffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const password = "senha123";
    const secretariaEmail = `secretaria_conv_${uniqueSuffix}@example.com`;
    const secretariaUsername = `sec_conv_${uniqueSuffix}`.slice(0, 30);

    const invite = await createInvite(null, "secretaria");

    const createResponse = await fetch(
      `http://localhost:${port}/api/v1/users`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: secretariaUsername,
          email: secretariaEmail,
          password,
          inviteCode: invite.code,
        }),
      },
    );

    expect(createResponse.status).toBe(201);

    const loginResponse = await fetch(
      `http://localhost:${port}/api/v1/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: secretariaEmail,
          password,
        }),
      },
    );

    expect(loginResponse.status).toBe(200);
    const { token } = await loginResponse.json();
    expect(token).toBeDefined();

    const listInvitesResponse = await fetch(
      `http://localhost:${port}/api/v1/invites`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    expect(listInvitesResponse.status).toBe(403);

    const createInviteResponse = await fetch(
      `http://localhost:${port}/api/v1/invites`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: `novo_usuario_${uniqueSuffix}@example.com`,
          role: "secretaria",
          expiresInDays: 3,
        }),
      },
    );

    expect(createInviteResponse.status).toBe(403);

    const sendEmailResponse = await fetch(
      `http://localhost:${port}/api/v1/invites/send-email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ inviteId: invite.id }),
      },
    );

    expect(sendEmailResponse.status).toBe(403);
  });
});

async function createTerapeutaFixture(label) {
  const sanitized = label.replace(/[^a-zA-Z0-9]/g, "");
  const limited = sanitized.slice(0, 10) || "TERAP";
  const digitSuffix = sanitized.replace(/\D/g, "").slice(0, 7) || "1234567";
  return terapeuta.create({
    nome: `Terapeuta ${label}`,
    telefone: `1199${digitSuffix}`.padEnd(11, "0").slice(0, 11),
    email: `terapeuta_${sanitized.toLowerCase()}@example.com`,
    crp: `CRP-${limited}`.slice(0, 20),
    dt_nascimento: "1990-01-01",
    dt_entrada: new Date().toISOString(),
    chave_pix: `pix-${limited}`,
  });
}

async function createPacienteFixture(terapeutaId, label) {
  const sanitized = label.replace(/[^a-zA-Z0-9]/g, "");
  const digitSuffix =
    sanitized.replace(/\D/g, "").slice(0, 11) || "12345678901";
  return paciente.create({
    nome: `Paciente ${label}`,
    dt_nascimento: "2010-01-01",
    terapeuta_id: terapeutaId,
    nome_responsavel: `Responsável ${label}`,
    telefone_responsavel: "11988887777",
    email_responsavel: `responsavel_${sanitized.toLowerCase()}@example.com`,
    cpf_responsavel: `${digitSuffix}`.padEnd(11, "0").slice(0, 11),
    endereco_responsavel: "Rua Teste, 123",
    origem: "Outros",
    dt_entrada: new Date().toISOString(),
  });
}

async function createAgendamentoFixture({
  terapeutaId,
  pacienteId,
  date,
  time,
}) {
  return agendamento.create({
    terapeuta_id: terapeutaId,
    paciente_id: pacienteId,
    dataAgendamento: date,
    horarioAgendamento: time,
    localAgendamento: "Sala Verde",
    modalidadeAgendamento: "Presencial",
    tipoAgendamento: "Sessão",
    valorAgendamento: 120,
    statusAgendamento: "Confirmado",
    observacoesAgendamento: "Fixture",
  });
}

async function createSessaoFixture({
  terapeutaId,
  pacienteId,
  agendamentoId = null,
  tipoSessao = "Atendimento",
  valorSessao = 150,
  notaFiscal = "Não Emitida",
  pagamentoRealizado = false,
  repasseRealizado = false,
  valorRepasse = null,
}) {
  return sessao.create({
    terapeuta_id: terapeutaId,
    paciente_id: pacienteId,
    agendamento_id: agendamentoId,
    tipoSessao,
    valorSessao,
    nota_fiscal: notaFiscal,
    pagamento_realizado: pagamentoRealizado,
    repasse_realizado: repasseRealizado,
    valor_repasse: valorRepasse,
  });
}
