import orchestrator from "tests/orchestrator.js";
import {
  ensureServerRunning,
  cleanupServer,
  waitForServerReady,
} from "tests/helpers/serverManager.js";
import { ensureDevAdminExists } from "tests/helpers/auth.js";
import terapeuta from "models/terapeuta.js";
import paciente from "models/paciente.js";
import sessao from "models/sessao.js";

export async function setupSessaoIntegrationTest(testName, port) {
  await ensureServerRunning(testName, port);
  await orchestrator.waitForAllServices();
  await waitForServerReady(port);
  await orchestrator.clearDatabase();
  await ensureDevAdminExists();
}

export function cleanupSessaoIntegrationTest(testName) {
  cleanupServer(testName);
}

export async function createTerapeutaFixture(label) {
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

export async function createPacienteFixture(terapeutaId, label) {
  const sanitized = label.replace(/[^a-zA-Z0-9]/g, "");
  const digitSuffix =
    sanitized.replace(/\D/g, "").slice(0, 11) || "12345678901";

  return paciente.create({
    nome: `Paciente ${label}`,
    dt_nascimento: "2010-01-01",
    terapeuta_id: terapeutaId,
    nome_responsavel: `Responsável ${label}`,
    telefone_responsavel: "11988887777",
    nf_nome_completo: `Paciente ${label}`,
    nf_telefone: "11988887777",
    nf_cpf: `${digitSuffix}`.padEnd(11, "0").slice(0, 11),
    nf_email: `nf_${sanitized.toLowerCase()}@example.com`,
    nf_endereco: "Rua Teste, 123",
    nf_dt_entrada: new Date().toISOString(),
    origem: "Outros",
    dt_entrada: new Date().toISOString(),
  });
}

export async function createSessaoFixture({
  terapeutaId,
  pacienteId,
  pagamentoRealizado = false,
  notaFiscal = "Não Emitida",
}) {
  return sessao.create({
    terapeuta_id: terapeutaId,
    paciente_id: pacienteId,
    tipoSessao: "Atendimento",
    valorSessao: 150,
    pagamento_realizado: pagamentoRealizado,
    repasse_realizado: false,
    nota_fiscal: notaFiscal,
  });
}
