const fetch = require("node-fetch");
const { randomUUID } = require("crypto");
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
const sessaoModel = require("models/sessao.js").default;

const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT || 3000;
const TEST_NAME = "Agendamentos - Criação e Edição";
const BASE_URL = `http://localhost:${port}/api/v1/agendamentos/`;

let adminToken;
let secretariaToken;
let terapeutaToken;

let terapeutaPrincipalId;
let terapeutaSecundarioId;
let pacientePrincipalId;
let pacienteSecundarioId;

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
    observacoesAgendamento: "Teste de integração",
  };
}

function buildUniqueSchedule() {
  const offsetMinutes = Math.floor(Math.random() * 24 * 60);
  const baseDate = new Date(Date.UTC(2026, 5, 1, 0, 0, 0));
  baseDate.setUTCMinutes(baseDate.getUTCMinutes() + offsetMinutes);

  return {
    data: baseDate.toISOString().slice(0, 10),
    hora: baseDate.toISOString().slice(11, 16),
  };
}

async function createAgendamentoFixture({
  token = adminToken,
  pacienteId = pacienteSecundarioId,
  terapeutaId = terapeutaSecundarioId,
  overrides = {},
} = {}) {
  const schedule = buildUniqueSchedule();
  const data = overrides.dataAgendamento || schedule.data;
  const hora = overrides.horarioAgendamento || schedule.hora;

  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      ...agendamentoPayloadBase({
        pacienteId,
        terapeutaId,
        data,
        hora,
      }),
      ...overrides,
    }),
  });

  const body = await res.json();
  return { res, body };
}

async function createRecurrenceFixture({
  token = adminToken,
  recurrenceId = randomUUID(),
  pacienteId = pacientePrincipalId,
  terapeutaId = terapeutaPrincipalId,
  overrides = {},
} = {}) {
  const schedule = buildUniqueSchedule();
  const data = overrides.agendamentoBase?.dataAgendamento || schedule.data;
  const hora = overrides.agendamentoBase?.horarioAgendamento || schedule.hora;

  const res = await fetch(`${BASE_URL}recurrences/${recurrenceId}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      agendamentoBase: {
        ...agendamentoPayloadBase({
          pacienteId,
          terapeutaId,
          data,
          hora,
        }),
        sessaoRealizada: false,
        falta: false,
        ...(overrides.agendamentoBase || {}),
      },
      diasDaSemana: ["Segunda-feira"],
      dataFimRecorrencia: "2026-06-29",
      periodicidade: "Semanal",
      ...overrides,
    }),
  });

  const body = await res.json();
  return { res, body, recurrenceId };
}

beforeAll(async () => {
  await ensureServerRunning(TEST_NAME, port);
  await orchestrator.waitForAllServices();
  await waitForServerReady(port);
  await orchestrator.clearDatabase();
  await ensureDevAdminExists();

  adminToken = await prepareAuthentication(port);
  secretariaToken = await createUserDirectlyAndLogin(port, {
    role: "secretaria",
  });
  terapeutaToken = await createUserDirectlyAndLogin(port, {
    role: "terapeuta",
  });

  const terapeutaUserId = jwt.decode(terapeutaToken).userId;
  const sufixo = Date.now();

  const terapeutaPrincipal = await terapeutaModel.create({
    nome: `Terapeuta Principal ${sufixo}`,
    telefone: "11999990001",
    email: `terapeuta.principal.${sufixo}@teste.com`,
    dt_entrada: "2024-01-01",
    chave_pix: "chave-principal",
    user_id: terapeutaUserId,
  });

  const terapeutaSecundario = await terapeutaModel.create({
    nome: `Terapeuta Secundario ${sufixo}`,
    telefone: "11999990002",
    email: `terapeuta.secundario.${sufixo}@teste.com`,
    dt_entrada: "2024-01-01",
    chave_pix: "chave-secundaria",
  });

  terapeutaPrincipalId = terapeutaPrincipal.id;
  terapeutaSecundarioId = terapeutaSecundario.id;

  const pacientePrincipal = await pacienteModel.create({
    nome: `Paciente Principal ${sufixo}`,
    dt_nascimento: "2010-01-01",
    terapeuta_id: terapeutaPrincipalId,
    nome_responsavel: "Responsavel Principal",
    telefone_responsavel: "11988880001",
    origem: "Indicação",
    dt_entrada: "2024-01-01",
    nf_nome_completo: "Responsavel Principal",
    nf_telefone: "11988880001",
    nf_cpf: "12345678901",
    nf_email: `responsavel.principal.${sufixo}@teste.com`,
    nf_endereco: "Rua Principal, 100",
    nf_dt_entrada: "2024-01-01",
  });

  const pacienteSecundario = await pacienteModel.create({
    nome: `Paciente Secundario ${sufixo}`,
    dt_nascimento: "2011-02-02",
    terapeuta_id: terapeutaSecundarioId,
    nome_responsavel: "Responsavel Secundario",
    telefone_responsavel: "11988880002",
    origem: "Busca no Google",
    dt_entrada: "2024-01-01",
    nf_nome_completo: "Responsavel Secundario",
    nf_telefone: "11988880002",
    nf_cpf: "12345678902",
    nf_email: `responsavel.secundario.${sufixo}@teste.com`,
    nf_endereco: "Rua Secundaria, 200",
    nf_dt_entrada: "2024-01-01",
  });

  pacientePrincipalId = pacientePrincipal.id;
  pacienteSecundarioId = pacienteSecundario.id;
});

afterAll(() => {
  cleanupServer(TEST_NAME);
});

describe("Agendamentos - Criação e Edição", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("Deve criar agendamento simples", async () => {
    const { res, body: agendamento } = await createAgendamentoFixture();

    expect(res.status).toBe(201);
    expect(agendamento).toHaveProperty("id");
    expect(agendamento.localAgendamento).toBe("Sala Azul");
  });

  test("Deve retornar 400 ao criar agendamento com data ausente", async () => {
    const payload = agendamentoPayloadBase({
      pacienteId: pacienteSecundarioId,
      terapeutaId: terapeutaSecundarioId,
      data: "2026-06-02",
      hora: "15:00",
    });

    delete payload.dataAgendamento;

    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(JSON.stringify(body)).toContain("Data do agendamento");
  });

  test("Deve negar criação sem autenticação", async () => {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        agendamentoPayloadBase({
          pacienteId: pacienteSecundarioId,
          terapeutaId: terapeutaSecundarioId,
          data: "2026-06-03",
          hora: "16:00",
        }),
      ),
    });

    expect(res.status).toBe(401);
  });

  test("Deve editar agendamento simples", async () => {
    const { body: agendamentoBase } = await createAgendamentoFixture();

    const res = await fetch(`${BASE_URL}${agendamentoBase.id}/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secretariaToken}`,
      },
      body: JSON.stringify({
        localAgendamento: "Sala Verde",
        statusAgendamento: "Confirmado",
      }),
    });

    const agendamento = await res.json();
    expect(res.status).toBe(200);
    expect(agendamento.localAgendamento).toBe("Sala Verde");
  });

  test("Deve persistir alteração de sessaoRealizada e falta no agendamento", async () => {
    const { body: agendamentoBase } = await createAgendamentoFixture();

    const marcarRes = await fetch(`${BASE_URL}${agendamentoBase.id}/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        sessaoRealizada: true,
        falta: true,
      }),
    });

    const marcado = await marcarRes.json();
    expect(marcarRes.status).toBe(200);
    expect(marcado.sessaoRealizada).toBe(true);
    expect(marcado.falta).toBe(true);

    const desmarcarRes = await fetch(`${BASE_URL}${agendamentoBase.id}/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        sessaoRealizada: false,
        falta: false,
      }),
    });

    const desmarcado = await desmarcarRes.json();
    expect(desmarcarRes.status).toBe(200);
    expect(desmarcado.sessaoRealizada).toBe(false);
    expect(desmarcado.falta).toBe(false);
  });

  test("Deve sincronizar valor da sessão ao editar apenas valorAgendamento", async () => {
    const { body: agendamentoBase } = await createAgendamentoFixture();

    const marcarRes = await fetch(`${BASE_URL}${agendamentoBase.id}/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        sessaoRealizada: true,
      }),
    });

    expect(marcarRes.status).toBe(200);

    const sessoesAntes = await sessaoModel.getFiltered({
      agendamento_id: agendamentoBase.id,
    });

    expect(sessoesAntes.length).toBeGreaterThan(0);
    expect(sessoesAntes[0].valorSessao).toBe(180);

    const editarValorRes = await fetch(`${BASE_URL}${agendamentoBase.id}/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        valorAgendamento: 250,
      }),
    });

    expect(editarValorRes.status).toBe(200);

    const sessoesDepois = await sessaoModel.getFiltered({
      agendamento_id: agendamentoBase.id,
    });

    expect(sessoesDepois.length).toBeGreaterThan(0);
    expect(sessoesDepois[0].valorSessao).toBe(250);
  });

  test("Não deve criar sessão ao editar valor quando sessão não existe", async () => {
    const { body: agendamentoBase } = await createAgendamentoFixture();

    const sessoesAntes = await sessaoModel.getFiltered({
      agendamento_id: agendamentoBase.id,
    });
    expect(sessoesAntes.length).toBe(0);

    const editarValorRes = await fetch(`${BASE_URL}${agendamentoBase.id}/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        valorAgendamento: 275,
      }),
    });

    expect(editarValorRes.status).toBe(200);

    const sessoesDepois = await sessaoModel.getFiltered({
      agendamento_id: agendamentoBase.id,
    });
    expect(sessoesDepois.length).toBe(0);
  });

  test("Deve retornar 500 quando houver erro de persistência ao editar valor", async () => {
    const { res: createRes, body: agendamentoBase } =
      await createAgendamentoFixture();
    expect(createRes.status).toBe(201);
    expect(agendamentoBase).toHaveProperty("id");

    const marcarRes = await fetch(`${BASE_URL}${agendamentoBase.id}/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        sessaoRealizada: true,
      }),
    });

    expect(marcarRes.status).toBe(200);

    const editarValorRes = await fetch(`${BASE_URL}${agendamentoBase.id}/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        valorAgendamento: "valor-invalido",
      }),
    });

    expect(editarValorRes.status).toBe(500);
    const body = await editarValorRes.json();
    expect(JSON.stringify(body)).toContain("Erro ao atualizar agendamento");
  });

  test("Deve negar edição para terapeuta sem acesso ao agendamento", async () => {
    const { body: agendamentoBase } = await createAgendamentoFixture();

    const res = await fetch(`${BASE_URL}${agendamentoBase.id}/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${terapeutaToken}`,
      },
      body: JSON.stringify({
        observacoesAgendamento: "Tentativa indevida",
      }),
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(JSON.stringify(body)).toContain("próprios agendamentos");
  });

  test("Deve retornar 422 em edição com localAgendamento inválido", async () => {
    const { body: agendamentoBase } = await createAgendamentoFixture();

    const res = await fetch(`${BASE_URL}${agendamentoBase.id}/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        localAgendamento: "Sala Inexistente",
      }),
    });

    expect(res.status).toBe(422);
    const body = await res.json();
    expect(JSON.stringify(body)).toContain("localAgendamento inválido");
  });

  test("Deve criar agendamentos recorrentes", async () => {
    const { res, body, recurrenceId } = await createRecurrenceFixture();

    expect(res.status).toBe(201);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(recurrenceId).toBeTruthy();
  });

  test("Deve negar criação recorrente sem autenticação", async () => {
    const res = await fetch(`${BASE_URL}recurrences/${randomUUID()}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agendamentoBase: {
          ...agendamentoPayloadBase({
            pacienteId: pacientePrincipalId,
            terapeutaId: terapeutaPrincipalId,
            data: "2026-07-06",
            hora: "10:00",
          }),
        },
        diasDaSemana: ["Segunda-feira"],
        dataFimRecorrencia: "2026-07-27",
        periodicidade: "Semanal",
      }),
    });

    expect(res.status).toBe(401);
  });

  test("Deve retornar 400 em criação recorrente com payload inválido", async () => {
    const res = await fetch(`${BASE_URL}recurrences/${randomUUID()}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        agendamentoBase: {
          ...agendamentoPayloadBase({
            pacienteId: pacientePrincipalId,
            terapeutaId: terapeutaPrincipalId,
            data: "2026-07-06",
            hora: "11:00",
          }),
        },
        dataFimRecorrencia: "2026-07-27",
        periodicidade: "Semanal",
      }),
    });

    expect(res.status).toBe(400);
  });

  test("Deve editar agendamento recorrente", async () => {
    const { recurrenceId } = await createRecurrenceFixture();

    const res = await fetch(`${BASE_URL}recurrences/${recurrenceId}/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        updateAllRecorrences: true,
        localAgendamento: "Sala Verde",
      }),
    });

    const body = await res.json();
    expect(res.status).toBe(200);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  test("Deve sincronizar valor das sessões em atualização de recorrência", async () => {
    const { res, body, recurrenceId } = await createRecurrenceFixture();

    expect(res.status).toBe(201);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);

    const ativarSessoesRes = await fetch(
      `${BASE_URL}recurrences/${recurrenceId}/`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          updateAllRecorrences: true,
          sessaoRealizada: true,
          valorAgendamento: 190,
        }),
      },
    );

    expect(ativarSessoesRes.status).toBe(200);
    const ativarSessoesBody = await ativarSessoesRes.json();
    const agendamentosRecorrentes = ativarSessoesBody.data;

    for (const item of agendamentosRecorrentes) {
      const sessoes = await sessaoModel.getFiltered({
        agendamento_id: item.id,
      });
      expect(sessoes.length).toBeGreaterThan(0);
      expect(sessoes[0].valorSessao).toBe(190);
    }

    const atualizarRes = await fetch(
      `${BASE_URL}recurrences/${recurrenceId}/`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          updateAllRecorrences: true,
          valorAgendamento: 325,
        }),
      },
    );

    expect(atualizarRes.status).toBe(200);

    const atualizarBody = await atualizarRes.json();
    expect(Array.isArray(atualizarBody.data)).toBe(true);
    expect(atualizarBody.data.length).toBeGreaterThan(0);

    for (const item of atualizarBody.data) {
      const sessoes = await sessaoModel.getFiltered({
        agendamento_id: item.id,
      });

      expect(sessoes.length).toBeGreaterThan(0);
      expect(sessoes[0].valorSessao).toBe(325);
    }
  });

  test("Deve negar edição recorrente sem autenticação", async () => {
    const { recurrenceId } = await createRecurrenceFixture();

    const res = await fetch(`${BASE_URL}recurrences/${recurrenceId}/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        updateAllRecorrences: true,
        localAgendamento: "Sala Azul",
      }),
    });

    expect(res.status).toBe(401);
  });

  test("Deve retornar 400 em edição recorrente sem flag updateAllRecorrences", async () => {
    const { recurrenceId } = await createRecurrenceFixture();

    const res = await fetch(`${BASE_URL}recurrences/${recurrenceId}/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        localAgendamento: "Sala Azul",
      }),
    });

    expect(res.status).toBe(400);
  });
});
