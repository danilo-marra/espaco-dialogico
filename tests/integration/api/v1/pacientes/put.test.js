import orchestrator from "tests/orchestrator.js";
import {
  prepareAuthentication,
  ensureDevAdminExists,
  createUserDirectlyAndLogin,
} from "tests/helpers/auth.js";
import terapeuta from "models/terapeuta.js";
import paciente from "models/paciente.js";
import agendamento from "models/agendamento.js";
import sessao from "models/sessao.js";
import {
  ensureServerRunning,
  cleanupServer,
  waitForServerReady,
} from "tests/helpers/serverManager.js";

const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT || 3000;
const TEST_NAME = "PUT /api/v1/pacientes/[id] - Atualização de Paciente";

beforeAll(async () => {
  await ensureServerRunning(TEST_NAME, port);
  await orchestrator.waitForAllServices();
  await waitForServerReady(port);
  await orchestrator.clearDatabase();
  await ensureDevAdminExists();
});

afterAll(() => {
  cleanupServer(TEST_NAME);
});

describe("PUT /api/v1/pacientes/[id]", () => {
  // ============ SUCESSO: Mudança de Terapeuta ============
  describe("Sucesso de atualização", () => {
    test("Deve atualizar o terapeuta_id do paciente com sucesso", async () => {
      const timestamp = Date.now();

      // 1. Criar dois terapeutas
      const terapeutaA = await terapeuta.create({
        nome: `Terapeuta A ${timestamp}`,
        telefone: "11999991111",
        email: `terapeutaA_${timestamp}@test.com`,
        crp: `CRP/SP-12345A`,
        dt_nascimento: "1990-01-01",
        dt_entrada: new Date().toISOString(),
        chave_pix: `pix_a_${timestamp}`,
      });

      const terapeutaB = await terapeuta.create({
        nome: `Terapeuta B ${timestamp}`,
        telefone: "11999992222",
        email: `terapeutaB_${timestamp}@test.com`,
        crp: `CRP/SP-12345B`,
        dt_nascimento: "1990-01-02",
        dt_entrada: new Date().toISOString(),
        chave_pix: `pix_b_${timestamp}`,
      });

      // 2. Criar paciente com Terapeuta A
      const pacienteOriginal = await paciente.create({
        nome: `Paciente Teste ${timestamp}`,
        dt_nascimento: "2010-01-01",
        terapeuta_id: terapeutaA.id,
        nome_responsavel: `Responsável ${timestamp}`,
        telefone_responsavel: "11988887777",
        nf_nome_completo: `Paciente Nota ${timestamp}`,
        nf_telefone: "11988887777",
        nf_cpf: "12345678901",
        nf_email: `nf_${timestamp}@test.com`,
        nf_endereco: "Rua Teste, 123",
        nf_dt_entrada: new Date().toISOString(),
        origem: "Outros",
        dt_entrada: new Date().toISOString(),
      });

      // 3. Obter token de autenticação (admin)
      const authTokens = await prepareAuthentication(port);
      const adminToken = authTokens;

      // 4. Fazer PUT para atualizar terapeuta para B
      const updateResponse = await fetch(
        `http://localhost:${port}/api/v1/pacientes/${pacienteOriginal.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            nome: pacienteOriginal.nome,
            dt_nascimento: pacienteOriginal.dt_nascimento,
            terapeuta_id: terapeutaB.id, // MUDANÇA AQUI
            nome_responsavel: pacienteOriginal.nome_responsavel,
            telefone_responsavel: pacienteOriginal.telefone_responsavel,
            nf_nome_completo: pacienteOriginal.nf_nome_completo,
            nf_telefone: pacienteOriginal.nf_telefone,
            nf_cpf: pacienteOriginal.nf_cpf,
            nf_email: pacienteOriginal.nf_email,
            nf_endereco: pacienteOriginal.nf_endereco,
            nf_dt_entrada: pacienteOriginal.nf_dt_entrada,
            origem: pacienteOriginal.origem,
            dt_entrada: pacienteOriginal.dt_entrada,
          }),
        },
      );

      // 5. Validar resposta HTTP
      expect(updateResponse.status).toBe(200);
      const responseBody = await updateResponse.json();
      expect(responseBody.terapeuta_id).toBe(terapeutaB.id);
      expect(responseBody.nome).toBe(pacienteOriginal.nome);

      // 6. Validar no banco de dados
      const updatedPaciente = await paciente.getById(pacienteOriginal.id);
      expect(updatedPaciente.terapeuta_id).toBe(terapeutaB.id);
      expect(updatedPaciente.updated_at).not.toBe(pacienteOriginal.updated_at);
    });
  });

  // ============ INTEGRIDADE: Agendamentos e Sessões não são alterados ============
  describe("Integridade de relacionamentos", () => {
    test("Agendamentos mantêm terapeuta_id original após atualização de paciente", async () => {
      const timestamp = Date.now();

      // 1. Criar terapeutas
      const terapeutaA = await terapeuta.create({
        nome: `Terapeuta A Agend ${timestamp}`,
        telefone: "11999991111",
        email: `terapeutaA_agend_${timestamp}@test.com`,
        crp: `CRP/SP-12345AA`,
        dt_nascimento: "1990-01-01",
        dt_entrada: new Date().toISOString(),
        chave_pix: `pix_a_agend_${timestamp}`,
      });

      const terapeutaB = await terapeuta.create({
        nome: `Terapeuta B Agend ${timestamp}`,
        telefone: "11999992222",
        email: `terapeutaB_agend_${timestamp}@test.com`,
        crp: `CRP/SP-12345BB`,
        dt_nascimento: "1990-01-02",
        dt_entrada: new Date().toISOString(),
        chave_pix: `pix_b_agend_${timestamp}`,
      });

      // 2. Criar paciente com Terapeuta A
      const pacienteOriginal = await paciente.create({
        nome: `Paciente Agendamentos ${timestamp}`,
        dt_nascimento: "2010-01-01",
        terapeuta_id: terapeutaA.id,
        nome_responsavel: `Responsável ${timestamp}`,
        telefone_responsavel: "11988887777",
        nf_nome_completo: `Paciente Agend ${timestamp}`,
        nf_telefone: "11988887777",
        nf_cpf: "12345678902",
        nf_email: `nf_agend_${timestamp}@test.com`,
        nf_endereco: "Rua Agendamentos, 123",
        nf_dt_entrada: new Date().toISOString(),
        origem: "Outros",
        dt_entrada: new Date().toISOString(),
      });

      // 3. Criar 3 agendamentos com Terapeuta A
      const agend1 = await agendamento.create({
        terapeuta_id: terapeutaA.id,
        paciente_id: pacienteOriginal.id,
        dataAgendamento: "2025-01-15",
        horarioAgendamento: "09:00",
        localAgendamento: "Sala Verde",
        modalidadeAgendamento: "Presencial",
        tipoAgendamento: "Sessão",
        valorAgendamento: 120,
        statusAgendamento: "Confirmado",
        observacoesAgendamento: "Fixture agendamento 1",
      });

      const agend2 = await agendamento.create({
        terapeuta_id: terapeutaA.id,
        paciente_id: pacienteOriginal.id,
        dataAgendamento: "2025-01-16",
        horarioAgendamento: "10:00",
        localAgendamento: "Sala Azul",
        modalidadeAgendamento: "Online",
        tipoAgendamento: "Sessão",
        valorAgendamento: 150,
        statusAgendamento: "Confirmado",
        observacoesAgendamento: "Fixture agendamento 2",
      });

      const agend3 = await agendamento.create({
        terapeuta_id: terapeutaA.id,
        paciente_id: pacienteOriginal.id,
        dataAgendamento: "2025-01-17",
        horarioAgendamento: "14:00",
        localAgendamento: "Sala Verde",
        modalidadeAgendamento: "Presencial",
        tipoAgendamento: "Supervisão",
        valorAgendamento: 100,
        statusAgendamento: "Confirmado",
        observacoesAgendamento: "Fixture agendamento 3",
      });

      // 4. Atualizar paciente para Terapeuta B
      const authTokens = await prepareAuthentication(port);
      const updateResponse = await fetch(
        `http://localhost:${port}/api/v1/pacientes/${pacienteOriginal.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authTokens}`,
          },
          body: JSON.stringify({
            nome: pacienteOriginal.nome,
            dt_nascimento: pacienteOriginal.dt_nascimento,
            terapeuta_id: terapeutaB.id, // MUDANÇA
            nome_responsavel: pacienteOriginal.nome_responsavel,
            telefone_responsavel: pacienteOriginal.telefone_responsavel,
            nf_nome_completo: pacienteOriginal.nf_nome_completo,
            nf_telefone: pacienteOriginal.nf_telefone,
            nf_cpf: pacienteOriginal.nf_cpf,
            nf_email: pacienteOriginal.nf_email,
            nf_endereco: pacienteOriginal.nf_endereco,
            nf_dt_entrada: pacienteOriginal.nf_dt_entrada,
            origem: pacienteOriginal.origem,
            dt_entrada: pacienteOriginal.dt_entrada,
          }),
        },
      );

      expect(updateResponse.status).toBe(200);

      // 5. Validar que agendamentos continuam com Terapeuta A
      const agendCheck1 = await agendamento.getById(agend1.id);
      const agendCheck2 = await agendamento.getById(agend2.id);
      const agendCheck3 = await agendamento.getById(agend3.id);

      expect(agendCheck1.terapeuta_id).toBe(terapeutaA.id);
      expect(agendCheck2.terapeuta_id).toBe(terapeutaA.id);
      expect(agendCheck3.terapeuta_id).toBe(terapeutaA.id);

      // Validar que continuam associados ao paciente
      expect(agendCheck1.paciente_id).toBe(pacienteOriginal.id);
      expect(agendCheck2.paciente_id).toBe(pacienteOriginal.id);
      expect(agendCheck3.paciente_id).toBe(pacienteOriginal.id);
    });

    test("Sessões mantêm terapeuta_id original após atualização de paciente", async () => {
      const timestamp = Date.now();

      // 1. Criar terapeutas
      const terapeutaA = await terapeuta.create({
        nome: `Terapeuta A Sess ${timestamp}`,
        telefone: "11999991111",
        email: `terapeutaA_sess_${timestamp}@test.com`,
        crp: `CRP/SP-12345AAA`,
        dt_nascimento: "1990-01-01",
        dt_entrada: new Date().toISOString(),
        chave_pix: `pix_a_sess_${timestamp}`,
      });

      const terapeutaB = await terapeuta.create({
        nome: `Terapeuta B Sess ${timestamp}`,
        telefone: "11999992222",
        email: `terapeutaB_sess_${timestamp}@test.com`,
        crp: `CRP/SP-12345BBB`,
        dt_nascimento: "1990-01-02",
        dt_entrada: new Date().toISOString(),
        chave_pix: `pix_b_sess_${timestamp}`,
      });

      // 2. Criar paciente com Terapeuta A
      const pacienteOriginal = await paciente.create({
        nome: `Paciente Sessões ${timestamp}`,
        dt_nascimento: "2010-01-01",
        terapeuta_id: terapeutaA.id,
        nome_responsavel: `Responsável ${timestamp}`,
        telefone_responsavel: "11988887777",
        nf_nome_completo: `Paciente Sess ${timestamp}`,
        nf_telefone: "11988887777",
        nf_cpf: "12345678903",
        nf_email: `nf_sess_${timestamp}@test.com`,
        nf_endereco: "Rua Sessões, 123",
        nf_dt_entrada: new Date().toISOString(),
        origem: "Outros",
        dt_entrada: new Date().toISOString(),
      });

      // 3. Criar 2 sessões com Terapeuta A
      const sess1 = await sessao.create({
        terapeuta_id: terapeutaA.id,
        paciente_id: pacienteOriginal.id,
        tipoSessao: "Atendimento",
        valorSessao: 150,
        statusSessao: "Pagamento Realizado",
        notaFiscal: "Não Emitida",
        pagamentoRealizado: true,
        repasseRealizado: false,
        valorRepasse: null,
      });

      const sess2 = await sessao.create({
        terapeuta_id: terapeutaA.id,
        paciente_id: pacienteOriginal.id,
        tipoSessao: "Anamnese",
        valorSessao: 100,
        statusSessao: "Pagamento Pendente",
        notaFiscal: "Não Emitida",
        pagamentoRealizado: false,
        repasseRealizado: false,
        valorRepasse: null,
      });

      // 4. Atualizar paciente para Terapeuta B
      const authTokens = await prepareAuthentication(port);
      const updateResponse = await fetch(
        `http://localhost:${port}/api/v1/pacientes/${pacienteOriginal.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authTokens}`,
          },
          body: JSON.stringify({
            nome: pacienteOriginal.nome,
            dt_nascimento: pacienteOriginal.dt_nascimento,
            terapeuta_id: terapeutaB.id, // MUDANÇA
            nome_responsavel: pacienteOriginal.nome_responsavel,
            telefone_responsavel: pacienteOriginal.telefone_responsavel,
            nf_nome_completo: pacienteOriginal.nf_nome_completo,
            nf_telefone: pacienteOriginal.nf_telefone,
            nf_cpf: pacienteOriginal.nf_cpf,
            nf_email: pacienteOriginal.nf_email,
            nf_endereco: pacienteOriginal.nf_endereco,
            nf_dt_entrada: pacienteOriginal.nf_dt_entrada,
            origem: pacienteOriginal.origem,
            dt_entrada: pacienteOriginal.dt_entrada,
          }),
        },
      );

      expect(updateResponse.status).toBe(200);

      // 5. Validar que sessões continuam com Terapeuta A
      const sessCheck1 = await sessao.getById(sess1.id);
      const sessCheck2 = await sessao.getById(sess2.id);

      expect(sessCheck1.terapeuta_id).toBe(terapeutaA.id);
      expect(sessCheck2.terapeuta_id).toBe(terapeutaA.id);

      // Validar que continuam associadas ao paciente
      expect(sessCheck1.paciente_id).toBe(pacienteOriginal.id);
      expect(sessCheck2.paciente_id).toBe(pacienteOriginal.id);
    });
  });

  // ============ VALIDAÇÃO: Campos obrigatórios ============
  describe("Validação de campos obrigatórios", () => {
    test("Deve retornar 400 quando terapeuta_id é vazio", async () => {
      const timestamp = Date.now();

      // Criar setup mínimo
      const terapeuta1 = await terapeuta.create({
        nome: `Terapeuta Val ${timestamp}`,
        telefone: "11999991111",
        email: `terapeutaVal_${timestamp}@test.com`,
        crp: `CRP/SP-12345CV`,
        dt_nascimento: "1990-01-01",
        dt_entrada: new Date().toISOString(),
        chave_pix: `pix_val_${timestamp}`,
      });

      const pacienteVal = await paciente.create({
        nome: `Paciente Val ${timestamp}`,
        dt_nascimento: "2010-01-01",
        terapeuta_id: terapeuta1.id,
        nome_responsavel: `Responsável ${timestamp}`,
        telefone_responsavel: "11988887777",
        nf_nome_completo: `Paciente Val ${timestamp}`,
        nf_telefone: "11988887777",
        nf_cpf: "12345678904",
        nf_email: `nf_val_${timestamp}@test.com`,
        nf_endereco: "Rua Val, 123",
        nf_dt_entrada: new Date().toISOString(),
        origem: "Outros",
        dt_entrada: new Date().toISOString(),
      });

      const authTokens = await prepareAuthentication(port);
      const updateResponse = await fetch(
        `http://localhost:${port}/api/v1/pacientes/${pacienteVal.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authTokens}`,
          },
          body: JSON.stringify({
            nome: pacienteVal.nome,
            dt_nascimento: pacienteVal.dt_nascimento,
            terapeuta_id: "", // VAZIO
            nome_responsavel: pacienteVal.nome_responsavel,
            telefone_responsavel: pacienteVal.telefone_responsavel,
            nf_nome_completo: pacienteVal.nf_nome_completo,
            nf_telefone: pacienteVal.nf_telefone,
            nf_cpf: pacienteVal.nf_cpf,
            nf_email: pacienteVal.nf_email,
            nf_endereco: pacienteVal.nf_endereco,
            nf_dt_entrada: pacienteVal.nf_dt_entrada,
            origem: pacienteVal.origem,
            dt_entrada: pacienteVal.dt_entrada,
          }),
        },
      );

      expect(updateResponse.status).toBe(400);
      const responseBody = await updateResponse.json();
      expect(responseBody.error).toBeDefined();
    });

    test("Deve retornar 404 quando paciente não existe", async () => {
      const authTokens = await prepareAuthentication(port);
      const fakeId = "00000000-0000-0000-0000-000000000000";

      const updateResponse = await fetch(
        `http://localhost:${port}/api/v1/pacientes/${fakeId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authTokens}`,
          },
          body: JSON.stringify({
            nome: "Algum Nome",
            dt_nascimento: "2010-01-01",
            terapeuta_id: fakeId,
            nome_responsavel: "Responsável",
            telefone_responsavel: "11988887777",
            nf_nome_completo: "Nome NF",
            nf_telefone: "11988887777",
            nf_cpf: "12345678900",
            nf_email: "test@test.com",
            nf_endereco: "Rua Test, 123",
            nf_dt_entrada: new Date().toISOString(),
            origem: "Outros",
            dt_entrada: new Date().toISOString(),
          }),
        },
      );

      expect(updateResponse.status).toBe(404);
    });
  });

  // ============ PERMISSÕES: Por Role ============
  describe("Permissões por role", () => {
    test("Admin pode atualizar qualquer paciente", async () => {
      const timestamp = Date.now();

      const terapeutaA = await terapeuta.create({
        nome: `Terapeuta Admin ${timestamp}`,
        telefone: "11999991111",
        email: `terapeutaAdmin_${timestamp}@test.com`,
        crp: `CRP/SP-12345ADM`,
        dt_nascimento: "1990-01-01",
        dt_entrada: new Date().toISOString(),
        chave_pix: `pix_adm_${timestamp}`,
      });

      const terapeutaB = await terapeuta.create({
        nome: `Terapeuta Admin2 ${timestamp}`,
        telefone: "11999992222",
        email: `terapeutaAdmin2_${timestamp}@test.com`,
        crp: `CRP/SP-12345ADM2`,
        dt_nascimento: "1990-01-02",
        dt_entrada: new Date().toISOString(),
        chave_pix: `pix_adm2_${timestamp}`,
      });

      const pacienteAdmin = await paciente.create({
        nome: `Paciente Admin ${timestamp}`,
        dt_nascimento: "2010-01-01",
        terapeuta_id: terapeutaA.id,
        nome_responsavel: `Responsável ${timestamp}`,
        telefone_responsavel: "11988887777",
        nf_nome_completo: `Paciente Admin ${timestamp}`,
        nf_telefone: "11988887777",
        nf_cpf: "12345678905",
        nf_email: `nf_admin_${timestamp}@test.com`,
        nf_endereco: "Rua Admin, 123",
        nf_dt_entrada: new Date().toISOString(),
        origem: "Outros",
        dt_entrada: new Date().toISOString(),
      });

      const authTokens = await prepareAuthentication(port);

      const updateResponse = await fetch(
        `http://localhost:${port}/api/v1/pacientes/${pacienteAdmin.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authTokens}`,
          },
          body: JSON.stringify({
            nome: pacienteAdmin.nome,
            dt_nascimento: pacienteAdmin.dt_nascimento,
            terapeuta_id: terapeutaB.id,
            nome_responsavel: pacienteAdmin.nome_responsavel,
            telefone_responsavel: pacienteAdmin.telefone_responsavel,
            nf_nome_completo: pacienteAdmin.nf_nome_completo,
            nf_telefone: pacienteAdmin.nf_telefone,
            nf_cpf: pacienteAdmin.nf_cpf,
            nf_email: pacienteAdmin.nf_email,
            nf_endereco: pacienteAdmin.nf_endereco,
            nf_dt_entrada: pacienteAdmin.nf_dt_entrada,
            origem: pacienteAdmin.origem,
            dt_entrada: pacienteAdmin.dt_entrada,
          }),
        },
      );

      expect(updateResponse.status).toBe(200);
      const responseBody = await updateResponse.json();
      expect(responseBody.terapeuta_id).toBe(terapeutaB.id);
    });

    test("Secretária pode atualizar qualquer paciente", async () => {
      const timestamp = Date.now();

      // Criar secretária
      const secretariaToken = await createUserDirectlyAndLogin(port, {
        role: "secretaria",
      });

      const terapeutaA = await terapeuta.create({
        nome: `Terapeuta Sec ${timestamp}`,
        telefone: "11999991111",
        email: `terapeutaSec_${timestamp}@test.com`,
        crp: `CRP/SP-12345SEC`,
        dt_nascimento: "1990-01-01",
        dt_entrada: new Date().toISOString(),
        chave_pix: `pix_sec_${timestamp}`,
      });

      const terapeutaB = await terapeuta.create({
        nome: `Terapeuta Sec2 ${timestamp}`,
        telefone: "11999992222",
        email: `terapeutaSec2_${timestamp}@test.com`,
        crp: `CRP/SP-12345SEC2`,
        dt_nascimento: "1990-01-02",
        dt_entrada: new Date().toISOString(),
        chave_pix: `pix_sec2_${timestamp}`,
      });

      const pacienteSec = await paciente.create({
        nome: `Paciente Sec ${timestamp}`,
        dt_nascimento: "2010-01-01",
        terapeuta_id: terapeutaA.id,
        nome_responsavel: `Responsável ${timestamp}`,
        telefone_responsavel: "11988887777",
        nf_nome_completo: `Paciente Sec ${timestamp}`,
        nf_telefone: "11988887777",
        nf_cpf: "12345678906",
        nf_email: `nf_sec_${timestamp}@test.com`,
        nf_endereco: "Rua Sec, 123",
        nf_dt_entrada: new Date().toISOString(),
        origem: "Outros",
        dt_entrada: new Date().toISOString(),
      });

      const updateResponse = await fetch(
        `http://localhost:${port}/api/v1/pacientes/${pacienteSec.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${secretariaToken}`,
          },
          body: JSON.stringify({
            nome: pacienteSec.nome,
            dt_nascimento: pacienteSec.dt_nascimento,
            terapeuta_id: terapeutaB.id,
            nome_responsavel: pacienteSec.nome_responsavel,
            telefone_responsavel: pacienteSec.telefone_responsavel,
            nf_nome_completo: pacienteSec.nf_nome_completo,
            nf_telefone: pacienteSec.nf_telefone,
            nf_cpf: pacienteSec.nf_cpf,
            nf_email: pacienteSec.nf_email,
            nf_endereco: pacienteSec.nf_endereco,
            nf_dt_entrada: pacienteSec.nf_dt_entrada,
            origem: pacienteSec.origem,
            dt_entrada: pacienteSec.dt_entrada,
          }),
        },
      );

      expect(updateResponse.status).toBe(200);
      const responseBody = await updateResponse.json();
      expect(responseBody.terapeuta_id).toBe(terapeutaB.id);
    });
  });

  // ============ EDGE CASES ============
  describe("Edge cases", () => {
    test("Deve atualizar apenas os campos fornecidos e manter os outros", async () => {
      const timestamp = Date.now();

      const terapeutaA = await terapeuta.create({
        nome: `Terapeuta Edge ${timestamp}`,
        telefone: "11999991111",
        email: `terapeutaEdge_${timestamp}@test.com`,
        crp: `CRP/SP-12345EDGE`,
        dt_nascimento: "1990-01-01",
        dt_entrada: new Date().toISOString(),
        chave_pix: `pix_edge_${timestamp}`,
      });

      const terapeutaB = await terapeuta.create({
        nome: `Terapeuta Edge2 ${timestamp}`,
        telefone: "11999992222",
        email: `terapeutaEdge2_${timestamp}@test.com`,
        crp: `CRP/SP-12345EDGE2`,
        dt_nascimento: "1990-01-02",
        dt_entrada: new Date().toISOString(),
        chave_pix: `pix_edge2_${timestamp}`,
      });

      const pacienteEdge = await paciente.create({
        nome: `Paciente Edge ${timestamp}`,
        dt_nascimento: "2010-01-01",
        terapeuta_id: terapeutaA.id,
        nome_responsavel: `Responsável Original`,
        telefone_responsavel: "11988887777",
        nf_nome_completo: `Paciente Edge NF`,
        nf_telefone: "11988887777",
        nf_cpf: "12345678907",
        nf_email: `nf_edge_${timestamp}@test.com`,
        nf_endereco: "Rua Edge Original, 123",
        nf_dt_entrada: new Date().toISOString(),
        origem: "Instagram",
        dt_entrada: new Date().toISOString(),
      });

      const authTokens = await prepareAuthentication(port);

      // Fazer PUT mudando APENAS terapeuta_id
      const updateResponse = await fetch(
        `http://localhost:${port}/api/v1/pacientes/${pacienteEdge.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authTokens}`,
          },
          body: JSON.stringify({
            nome: pacienteEdge.nome,
            dt_nascimento: pacienteEdge.dt_nascimento,
            terapeuta_id: terapeutaB.id, // MUDANÇA
            nome_responsavel: pacienteEdge.nome_responsavel,
            telefone_responsavel: pacienteEdge.telefone_responsavel,
            nf_nome_completo: pacienteEdge.nf_nome_completo,
            nf_telefone: pacienteEdge.nf_telefone,
            nf_cpf: pacienteEdge.nf_cpf,
            nf_email: pacienteEdge.nf_email,
            nf_endereco: pacienteEdge.nf_endereco,
            nf_dt_entrada: pacienteEdge.nf_dt_entrada,
            origem: pacienteEdge.origem,
            dt_entrada: pacienteEdge.dt_entrada,
          }),
        },
      );

      expect(updateResponse.status).toBe(200);
      const responseBody = await updateResponse.json();

      // Validar que apenas terapeuta_id mudou
      expect(responseBody.terapeuta_id).toBe(terapeutaB.id);
      expect(responseBody.nome_responsavel).toBe(`Responsável Original`);
      expect(responseBody.nf_endereco).toBe(`Rua Edge Original, 123`);
      expect(responseBody.origem).toBe("Instagram");
    });
  });
});
