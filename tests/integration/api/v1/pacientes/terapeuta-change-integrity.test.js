import orchestrator from "tests/orchestrator.js";
import {
  prepareAuthentication,
  ensureDevAdminExists,
} from "tests/helpers/auth.js";
import terapeuta from "models/terapeuta.js";
import paciente from "models/paciente.js";
import agendamento from "models/agendamento.js";
import sessao from "models/sessao.js";
import database from "infra/database.js";
import {
  ensureServerRunning,
  cleanupServer,
  waitForServerReady,
} from "tests/helpers/serverManager.js";

const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT || 3000;
const TEST_NAME = "Terapeuta Change Integrity - Cenários de Negócio Completos";

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

describe("Cenários de Integridade de Dados - Mudança de Terapeuta", () => {
  // ============ CENÁRIO 1: Histórico Completo Preservado ============
  describe("Histórico completo preservado", () => {
    test("Dados de agendamento, sessão e transações mantêm referência ao terapeuta original", async () => {
      const timestamp = Date.now();

      // 1. Setup: Criar terapeutas
      const terapeutaA = await terapeuta.create({
        nome: `Terapeuta A Historico ${timestamp}`,
        telefone: "11999991111",
        email: `terapeutaA_hist_${timestamp}@test.com`,
        crp: `CRP/SP-12345AHIST`,
        dt_nascimento: "1990-01-01",
        dt_entrada: new Date().toISOString(),
        chave_pix: `pix_a_hist_${timestamp}`,
      });

      const terapeutaB = await terapeuta.create({
        nome: `Terapeuta B Historico ${timestamp}`,
        telefone: "11999992222",
        email: `terapeutaB_hist_${timestamp}@test.com`,
        crp: `CRP/SP-12345BHIST`,
        dt_nascimento: "1990-01-02",
        dt_entrada: new Date().toISOString(),
        chave_pix: `pix_b_hist_${timestamp}`,
      });

      // 2. Criar paciente com Terapeuta A
      const pacienteOriginal = await paciente.create({
        nome: `Paciente Historico Completo ${timestamp}`,
        dt_nascimento: "2010-01-01",
        terapeuta_id: terapeutaA.id,
        nome_responsavel: `Responsável ${timestamp}`,
        telefone_responsavel: "11988887777",
        nf_nome_completo: `Paciente Hist ${timestamp}`,
        nf_telefone: "11988887777",
        nf_cpf: "12345678908",
        nf_email: `nf_hist_${timestamp}@test.com`,
        nf_endereco: "Rua Historico, 123",
        nf_dt_entrada: new Date().toISOString(),
        origem: "Indicação",
        dt_entrada: new Date().toISOString(),
      });

      // 3. Criar múltiplos agendamentos com Terapeuta A
      const agendamentos = [];
      for (let i = 0; i < 2; i++) {
        const a = await agendamento.create({
          terapeuta_id: terapeutaA.id,
          paciente_id: pacienteOriginal.id,
          dataAgendamento: `2025-01-${15 + i}`,
          horarioAgendamento: `${9 + i}:00`,
          localAgendamento: i % 2 === 0 ? "Sala Verde" : "Sala Azul",
          modalidadeAgendamento: "Presencial",
          tipoAgendamento: "Sessão",
          valorAgendamento: 120 + i * 10,
          statusAgendamento: "Confirmado",
          observacoesAgendamento: `Agendamento ${i + 1}`,
        });
        agendamentos.push(a);
      }

      // 4. Criar múltiplas sessões com Terapeuta A
      const sessoes = [];
      for (let i = 0; i < 3; i++) {
        const s = await sessao.create({
          terapeuta_id: terapeutaA.id,
          paciente_id: pacienteOriginal.id,
          tipoSessao: i === 0 ? "Anamnese" : "Atendimento",
          valorSessao: 100 + i * 25,
          statusSessao: i === 0 ? "Pagamento Pendente" : "Pagamento Realizado",
          notaFiscal: "Não Emitida",
          pagamento_realizado: i > 0,
          repasse_realizado: false,
          valor_repasse: i > 0 ? 80 + i * 20 : null,
        });
        sessoes.push(s);
      }

      // 5. EXECUTAR: Atualizar paciente para Terapeuta B
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

      // 6. VALIDAÇÃO: Verificar que paciente mudou
      const pacienteAtualizado = await paciente.getById(pacienteOriginal.id);
      expect(pacienteAtualizado.terapeuta_id).toBe(terapeutaB.id);

      // 7. VALIDAÇÃO: Todos os agendamentos continuam com Terapeuta A
      for (const agend of agendamentos) {
        const agendCheck = await agendamento.getById(agend.id);
        expect(agendCheck.terapeuta_id).toBe(terapeutaA.id);
        expect(agendCheck.paciente_id).toBe(pacienteOriginal.id);
      }

      // 8. VALIDAÇÃO: Todas as sessões continuam com Terapeuta A
      for (const sess of sessoes) {
        const sessCheck = await sessao.getById(sess.id);
        expect(sessCheck.terapeuta_id).toBe(terapeutaA.id);
        expect(sessCheck.paciente_id).toBe(pacienteOriginal.id);
      }

      // 9. VALIDAÇÃO: Dados financeiros continuam corretos
      const sessao1Check = await sessao.getById(sessoes[1].id);
      expect(sessao1Check.valorSessao).toBe(125);
      expect(sessao1Check.pagamentoRealizado).toBe(true);
    });
  });

  // ============ CENÁRIO 2: Múltiplas Mudanças Sequenciais ============
  describe("Múltiplas mudanças sequenciais", () => {
    test("Histórico mantém referência à terapeuta correta após A→B→C", async () => {
      const timestamp = Date.now();

      // 1. Criar 3 terapeutas
      const terapeutaA = await terapeuta.create({
        nome: `Terapeuta A Sequential ${timestamp}`,
        telefone: "11999991111",
        email: `terapeutaA_seq_${timestamp}@test.com`,
        crp: `CRP/SP-12345ASEQ`,
        dt_nascimento: "1990-01-01",
        dt_entrada: new Date().toISOString(),
        chave_pix: `pix_a_seq_${timestamp}`,
      });

      const terapeutaB = await terapeuta.create({
        nome: `Terapeuta B Sequential ${timestamp}`,
        telefone: "11999992222",
        email: `terapeutaB_seq_${timestamp}@test.com`,
        crp: `CRP/SP-12345BSEQ`,
        dt_nascimento: "1990-01-02",
        dt_entrada: new Date().toISOString(),
        chave_pix: `pix_b_seq_${timestamp}`,
      });

      const terapeutaC = await terapeuta.create({
        nome: `Terapeuta C Sequential ${timestamp}`,
        telefone: "11999993333",
        email: `terapeutaC_seq_${timestamp}@test.com`,
        crp: `CRP/SP-12345CSEQ`,
        dt_nascimento: "1990-01-03",
        dt_entrada: new Date().toISOString(),
        chave_pix: `pix_c_seq_${timestamp}`,
      });

      // 2. Criar paciente com Terapeuta A
      const pacienteSeq = await paciente.create({
        nome: `Paciente Sequential ${timestamp}`,
        dt_nascimento: "2010-01-01",
        terapeuta_id: terapeutaA.id,
        nome_responsavel: `Responsável ${timestamp}`,
        telefone_responsavel: "11988887777",
        nf_nome_completo: `Paciente Seq ${timestamp}`,
        nf_telefone: "11988887777",
        nf_cpf: "12345678909",
        nf_email: `nf_seq_${timestamp}@test.com`,
        nf_endereco: "Rua Sequential, 123",
        nf_dt_entrada: new Date().toISOString(),
        origem: "Outros",
        dt_entrada: new Date().toISOString(),
      });

      // 3. Criar agendamento com Terapeuta A (PERÍODO A)
      const agendA = await agendamento.create({
        terapeuta_id: terapeutaA.id,
        paciente_id: pacienteSeq.id,
        dataAgendamento: "2025-01-10",
        horarioAgendamento: "09:00",
        localAgendamento: "Sala Verde",
        modalidadeAgendamento: "Presencial",
        tipoAgendamento: "Sessão",
        valorAgendamento: 100,
        statusAgendamento: "Confirmado",
        observacoesAgendamento: "Período A",
      });

      const authTokens = await prepareAuthentication(port);

      // 4. MUDANÇA 1: A → B
      let updateResponse = await fetch(
        `http://localhost:${port}/api/v1/pacientes/${pacienteSeq.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authTokens}`,
          },
          body: JSON.stringify({
            nome: pacienteSeq.nome,
            dt_nascimento: pacienteSeq.dt_nascimento,
            terapeuta_id: terapeutaB.id,
            nome_responsavel: pacienteSeq.nome_responsavel,
            telefone_responsavel: pacienteSeq.telefone_responsavel,
            nf_nome_completo: pacienteSeq.nf_nome_completo,
            nf_telefone: pacienteSeq.nf_telefone,
            nf_cpf: pacienteSeq.nf_cpf,
            nf_email: pacienteSeq.nf_email,
            nf_endereco: pacienteSeq.nf_endereco,
            nf_dt_entrada: pacienteSeq.nf_dt_entrada,
            origem: pacienteSeq.origem,
            dt_entrada: pacienteSeq.dt_entrada,
          }),
        },
      );
      expect(updateResponse.status).toBe(200);

      // 5. Criar agendamento com Terapeuta B (PERÍODO B)
      const agendB = await agendamento.create({
        terapeuta_id: terapeutaB.id,
        paciente_id: pacienteSeq.id,
        dataAgendamento: "2025-01-20",
        horarioAgendamento: "10:00",
        localAgendamento: "Sala Azul",
        modalidadeAgendamento: "Online",
        tipoAgendamento: "Sessão",
        valorAgendamento: 120,
        statusAgendamento: "Confirmado",
        observacoesAgendamento: "Período B",
      });

      // 6. MUDANÇA 2: B → C
      updateResponse = await fetch(
        `http://localhost:${port}/api/v1/pacientes/${pacienteSeq.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authTokens}`,
          },
          body: JSON.stringify({
            nome: pacienteSeq.nome,
            dt_nascimento: pacienteSeq.dt_nascimento,
            terapeuta_id: terapeutaC.id,
            nome_responsavel: pacienteSeq.nome_responsavel,
            telefone_responsavel: pacienteSeq.telefone_responsavel,
            nf_nome_completo: pacienteSeq.nf_nome_completo,
            nf_telefone: pacienteSeq.nf_telefone,
            nf_cpf: pacienteSeq.nf_cpf,
            nf_email: pacienteSeq.nf_email,
            nf_endereco: pacienteSeq.nf_endereco,
            nf_dt_entrada: pacienteSeq.nf_dt_entrada,
            origem: pacienteSeq.origem,
            dt_entrada: pacienteSeq.dt_entrada,
          }),
        },
      );
      expect(updateResponse.status).toBe(200);

      // 7. Criar agendamento com Terapeuta C (PERÍODO C)
      const agendC = await agendamento.create({
        terapeuta_id: terapeutaC.id,
        paciente_id: pacienteSeq.id,
        dataAgendamento: "2025-01-30",
        horarioAgendamento: "11:00",
        localAgendamento: "Sala Verde",
        modalidadeAgendamento: "Presencial",
        tipoAgendamento: "Supervisão",
        valorAgendamento: 150,
        statusAgendamento: "Confirmado",
        observacoesAgendamento: "Período C",
      });

      // 8. VALIDAÇÃO: Paciente agora é do Terapeuta C
      const pacienteFinal = await paciente.getById(pacienteSeq.id);
      expect(pacienteFinal.terapeuta_id).toBe(terapeutaC.id);

      // 9. VALIDAÇÃO: Agendamentos mantêm suas respectivas terapeutas
      const agendACheck = await agendamento.getById(agendA.id);
      expect(agendACheck.terapeuta_id).toBe(terapeutaA.id);

      const agendBCheck = await agendamento.getById(agendB.id);
      expect(agendBCheck.terapeuta_id).toBe(terapeutaB.id);

      const agendCCheck = await agendamento.getById(agendC.id);
      expect(agendCCheck.terapeuta_id).toBe(terapeutaC.id);

      // 10. VALIDAÇÃO: Histórico cronológico está correto
      const allAgendamentos = [agendACheck, agendBCheck, agendCCheck];
      expect(allAgendamentos[0].observacoesAgendamento).toBe("Período A");
      expect(allAgendamentos[1].observacoesAgendamento).toBe("Período B");
      expect(allAgendamentos[2].observacoesAgendamento).toBe("Período C");
    });
  });

  // ============ CENÁRIO 3: Dados de Nota Fiscal Não são Afetados ============
  describe("Dados de nota fiscal preservados", () => {
    test("Mudança de terapeuta não altera campos de nota fiscal", async () => {
      const timestamp = Date.now();

      const terapeutaA = await terapeuta.create({
        nome: `Terapeuta A NF ${timestamp}`,
        telefone: "11999991111",
        email: `terapeutaA_nf_${timestamp}@test.com`,
        crp: `CRP/SP-12345ANF`,
        dt_nascimento: "1990-01-01",
        dt_entrada: new Date().toISOString(),
        chave_pix: `pix_a_nf_${timestamp}`,
      });

      const terapeutaB = await terapeuta.create({
        nome: `Terapeuta B NF ${timestamp}`,
        telefone: "11999992222",
        email: `terapeutaB_nf_${timestamp}@test.com`,
        crp: `CRP/SP-12345BNF`,
        dt_nascimento: "1990-01-02",
        dt_entrada: new Date().toISOString(),
        chave_pix: `pix_b_nf_${timestamp}`,
      });

      // Criar paciente com dados específicos de NF
      const nfCPF = "98765432100";
      const nfEmail = `cliente_nf_${timestamp}@empresa.com.br`;
      const nfEndereco = "Avenida Principal, 1000 - Apt 501";

      const pacienteNF = await paciente.create({
        nome: `Paciente NF ${timestamp}`,
        dt_nascimento: "2010-01-01",
        terapeuta_id: terapeutaA.id,
        nome_responsavel: `Responsável ${timestamp}`,
        telefone_responsavel: "11988887777",
        nf_nome_completo: `Cliente Nota Fiscal ${timestamp}`,
        nf_telefone: "1133334444",
        nf_cpf: nfCPF,
        nf_email: nfEmail,
        nf_endereco: nfEndereco,
        nf_dt_entrada: "2024-06-15",
        origem: "Outros",
        dt_entrada: new Date().toISOString(),
      });

      const authTokens = await prepareAuthentication(port);

      // Fazer mudança de terapeuta
      const updateResponse = await fetch(
        `http://localhost:${port}/api/v1/pacientes/${pacienteNF.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authTokens}`,
          },
          body: JSON.stringify({
            nome: pacienteNF.nome,
            dt_nascimento: pacienteNF.dt_nascimento,
            terapeuta_id: terapeutaB.id, // MUDANÇA
            nome_responsavel: pacienteNF.nome_responsavel,
            telefone_responsavel: pacienteNF.telefone_responsavel,
            nf_nome_completo: pacienteNF.nf_nome_completo,
            nf_telefone: pacienteNF.nf_telefone,
            nf_cpf: pacienteNF.nf_cpf,
            nf_email: pacienteNF.nf_email,
            nf_endereco: pacienteNF.nf_endereco,
            nf_dt_entrada: pacienteNF.nf_dt_entrada,
            origem: pacienteNF.origem,
            dt_entrada: pacienteNF.dt_entrada,
          }),
        },
      );

      expect(updateResponse.status).toBe(200);

      // Validar que dados de NF foram preservados
      const pacienteVerify = await paciente.getById(pacienteNF.id);
      expect(pacienteVerify.nf_cpf).toBe(nfCPF);
      expect(pacienteVerify.nf_email).toBe(nfEmail);
      expect(pacienteVerify.nf_endereco).toBe(nfEndereco);
      expect(
        new Date(pacienteVerify.nf_dt_entrada).toISOString().split("T")[0],
      ).toBe("2024-06-15");
      expect(pacienteVerify.terapeuta_id).toBe(terapeutaB.id);
    });
  });

  // ============ CENÁRIO 4: Consistência de Dados em Dashboard ============
  describe("Dados de dashboard continuam consistentes", () => {
    test("Totalizações de sessões não são duplicadas após mudança de terapeuta", async () => {
      const timestamp = Date.now();

      const terapeutaA = await terapeuta.create({
        nome: `Terapeuta A Dashboard ${timestamp}`,
        telefone: "11999991111",
        email: `terapeutaA_dash_${timestamp}@test.com`,
        crp: `CRP/SP-12345ADASH`,
        dt_nascimento: "1990-01-01",
        dt_entrada: new Date().toISOString(),
        chave_pix: `pix_a_dash_${timestamp}`,
      });

      const terapeutaB = await terapeuta.create({
        nome: `Terapeuta B Dashboard ${timestamp}`,
        telefone: "11999992222",
        email: `terapeutaB_dash_${timestamp}@test.com`,
        crp: `CRP/SP-12345BDASH`,
        dt_nascimento: "1990-01-02",
        dt_entrada: new Date().toISOString(),
        chave_pix: `pix_b_dash_${timestamp}`,
      });

      const pacienteDash = await paciente.create({
        nome: `Paciente Dashboard ${timestamp}`,
        dt_nascimento: "2010-01-01",
        terapeuta_id: terapeutaA.id,
        nome_responsavel: `Responsável ${timestamp}`,
        telefone_responsavel: "11988887777",
        nf_nome_completo: `Paciente Dashboard ${timestamp}`,
        nf_telefone: "11988887777",
        nf_cpf: "12345678910",
        nf_email: `nf_dash_${timestamp}@test.com`,
        nf_endereco: "Rua Dashboard, 123",
        nf_dt_entrada: new Date().toISOString(),
        origem: "Outros",
        dt_entrada: new Date().toISOString(),
      });

      // Criar 2 sessões com valores para o Terapeuta A
      await sessao.create({
        terapeuta_id: terapeutaA.id,
        paciente_id: pacienteDash.id,
        tipoSessao: "Atendimento",
        valorSessao: 150,
        statusSessao: "Pagamento Realizado",
        notaFiscal: "Não Emitida",
        pagamentoRealizado: true,
        repasseRealizado: true,
        valorRepasse: 120,
      });

      await sessao.create({
        terapeuta_id: terapeutaA.id,
        paciente_id: pacienteDash.id,
        tipoSessao: "Atendimento",
        valorSessao: 150,
        statusSessao: "Pagamento Realizado",
        notaFiscal: "Não Emitida",
        pagamentoRealizado: true,
        repasseRealizado: true,
        valorRepasse: 120,
      });

      // Query total de sessões para Terapeuta A
      let queryA = await database.query({
        text: `
          SELECT COUNT(*) as total_sessoes, SUM(valor_sessao) as total_valor
          FROM sessoes
          WHERE terapeuta_id = $1
        `,
        values: [terapeutaA.id],
      });

      const totalSessionsA_Before = parseInt(queryA.rows[0].total_sessoes);
      const totalValueA_Before = parseFloat(queryA.rows[0].total_valor || 0);

      expect(totalSessionsA_Before).toBe(2);
      expect(totalValueA_Before).toBe(300);

      // Atualizar paciente para Terapeuta B
      const authTokens = await prepareAuthentication(port);
      await fetch(
        `http://localhost:${port}/api/v1/pacientes/${pacienteDash.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authTokens}`,
          },
          body: JSON.stringify({
            nome: pacienteDash.nome,
            dt_nascimento: pacienteDash.dt_nascimento,
            terapeuta_id: terapeutaB.id,
            nome_responsavel: pacienteDash.nome_responsavel,
            telefone_responsavel: pacienteDash.telefone_responsavel,
            nf_nome_completo: pacienteDash.nf_nome_completo,
            nf_telefone: pacienteDash.nf_telefone,
            nf_cpf: pacienteDash.nf_cpf,
            nf_email: pacienteDash.nf_email,
            nf_endereco: pacienteDash.nf_endereco,
            nf_dt_entrada: pacienteDash.nf_dt_entrada,
            origem: pacienteDash.origem,
            dt_entrada: pacienteDash.dt_entrada,
          }),
        },
      );

      // Query novamente para Terapeuta A
      queryA = await database.query({
        text: `
          SELECT COUNT(*) as total_sessoes, SUM(valor_sessao) as total_valor
          FROM sessoes
          WHERE terapeuta_id = $1
        `,
        values: [terapeutaA.id],
      });

      const totalSessionsA_After = parseInt(queryA.rows[0].total_sessoes);
      const totalValueA_After = parseFloat(queryA.rows[0].total_valor || 0);

      // VALIDAÇÃO: Sessões e valores de Terapeuta A NÃO MUDARAM
      expect(totalSessionsA_After).toBe(totalSessionsA_Before);
      expect(totalValueA_After).toBe(totalValueA_Before);

      // Query para Terapeuta B (não deve ter mudado)
      const queryB = await database.query({
        text: `
          SELECT COUNT(*) as total_sessoes
          FROM sessoes
          WHERE terapeuta_id = $1
        `,
        values: [terapeutaB.id],
      });

      const totalSessionsB = parseInt(queryB.rows[0].total_sessoes);
      expect(totalSessionsB).toBe(0); // Terapeuta B não herda as sessões do A
    });
  });
});
