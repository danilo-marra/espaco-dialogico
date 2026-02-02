/**
 * Uso:
 *   1) Gerar template: node infra/scripts/generate-import-templates.js
 *   2) Preencher XLSX e validar (dry-run):
 *        node infra/scripts/import-xlsx.js --file infra/data/preenchido.xlsx
 *   3) Aplicar no banco:
 *        node infra/scripts/import-xlsx.js --file infra/data/preenchido.xlsx --apply
 *
 * Defaults usados quando campos obrigatórios faltarem:
 *   - terapeutas.dt_entrada: 01/01/2025
 *   - terapeutas.chave_pix: "PENDENTE"
 *   - pacientes.dt_nascimento: 01/01/2000
 *   - pacientes.dt_entrada: 12/12/2025
 *   - pacientes.nome_responsavel / telefone_responsavel: "PENDENTE"
 *
 * Banco de produção (Vercel):
 *   vercel env pull .env.production.local
 *   set NODE_ENV=production && node infra/scripts/ensure-unique-indexes.js
 *   set NODE_ENV=production && node infra/scripts/import-xlsx.js --file infra/data/preenchido.xlsx --apply
 */
const dotenv = require("dotenv");
const dotenvExpand = require("dotenv-expand");
const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");

const argv = process.argv.slice(2);
function arg(flag) {
  const i = argv.indexOf(flag);
  return i >= 0 ? argv[i + 1] : undefined;
}
const file = arg("--file") || arg("-f");
const apply = argv.includes("--apply");
const debug = argv.includes("--debug");

// Escolha do .env (permite --env .env.development.local)
const defaultEnv = fs.existsSync(path.resolve(process.cwd(), ".env.local"))
  ? ".env.local"
  : ".env.production.local";
const envPath = arg("--env") || defaultEnv;
const myEnv = dotenv.config({ path: path.resolve(process.cwd(), envPath) });
dotenvExpand.expand(myEnv);

if (debug) {
  const url = process.env.DATABASE_URL || "";
  const masked = url.replace(/:\/\/.*@/, "://****:****@");
  console.log(`ENV file: ${envPath}`);
  console.log(`DATABASE_URL: ${masked}`);
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL não definida.");
  } else if (process.env.DATABASE_URL.includes("$")) {
    console.error("❌ DATABASE_URL contém placeholders não resolvidos ($VAR).");
  }
}

// IMPORTANTE: só agora requisitar o database (após carregar o .env)
const database = require("../database.js");

if (!file) {
  console.error("❌ Informe o arquivo: --file caminho/arquivo.xlsx");
  process.exit(1);
}

const ORIGENS = new Set([
  "Indicação",
  "Instagram",
  "Busca no Google",
  "Outros",
]);

const DEFAULTS = {
  terapeuta_dt_entrada: "01/01/2025",
  terapeuta_chave_pix: "PENDENTE",
  paciente_dt_nascimento: "01/01/2000",
  paciente_dt_entrada: "12/12/2025",
  paciente_nome_responsavel: "PENDENTE",
  paciente_telefone_responsavel: "(00) 00000-0000",
};

const onlyDigits = (s) => (s || "").toString().replace(/\D+/g, "");
const toStr = (v) => (v === undefined || v === null ? "" : String(v).trim());
function toDateOrNull(v) {
  if (v === undefined || v === null || v === "") return null;
  if (v instanceof Date && !isNaN(v.getTime())) return v;
  if (typeof v === "number") {
    // Excel serial date
    const o = xlsx.SSF.parse_date_code(v);
    if (o)
      return new Date(
        Date.UTC(o.y, o.m - 1, o.d, o.H || 0, o.M || 0, o.S || 0),
      );
  }
  // Suporte a DD/MM/AAAA
  const br = /^\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s*$/;
  const m = typeof v === "string" ? v.match(br) : null;
  if (m) {
    const d = parseInt(m[1], 10);
    const mth = parseInt(m[2], 10) - 1;
    const y = parseInt(m[3], 10);
    const dt = new Date(Date.UTC(y, mth, d));
    return isNaN(dt.getTime()) ? null : dt;
  }
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? null : d;
}
const normEmail = (s) => toStr(s).toLowerCase();
const normCPF = (s) => onlyDigits(s);
const normPhone = (s) => onlyDigits(s);
const isUUID = (s) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    toStr(s),
  );
const normOrigem = (s) => {
  const v = toStr(s);
  // Banco exige NOT NULL + CHECK, padronizar para "Outros" quando vazio/fora do enum
  return ORIGENS.has(v) ? v : "Outros";
};

function parseSheet(sheet) {
  if (!sheet) return [];
  // cellDates: true já é usado no readFile; defval mantém chaves ausentes
  return xlsx.utils.sheet_to_json(sheet, { defval: "" });
}

function requireFields(row, fields, label) {
  const missing = fields.filter((f) => !toStr(row[f]));
  return missing.length ? `${label} faltando: ${missing.join(", ")}` : null;
}

async function upsertTerapeuta(client, t) {
  const email = normEmail(t.email);
  const res = await client.query({
    text: "SELECT id FROM terapeutas WHERE LOWER(email) = $1 LIMIT 1",
    values: [email],
  });
  const existing = res.rows[0];

  const payload = {
    nome: toStr(t.nome),
    telefone: toStr(t.telefone),
    email,
    crp: toStr(t.crp) || null,
    dt_nascimento: toDateOrNull(t.dt_nascimento),
    dt_entrada:
      toDateOrNull(t.dt_entrada) ||
      toDateOrNull(DEFAULTS.terapeuta_dt_entrada) ||
      new Date(),
    chave_pix: toStr(t.chave_pix) || DEFAULTS.terapeuta_chave_pix,
    foto: toStr(t.foto) || null,
    curriculo_arquivo: toStr(t.curriculo_arquivo) || null,
  };

  if (existing) {
    const q = `
      UPDATE terapeutas
      SET nome=$1, telefone=$2, email=$3, crp=$4, dt_nascimento=$5, dt_entrada=$6,
          chave_pix=$7, foto=$8, curriculo_arquivo=$9, updated_at=NOW()
      WHERE id=$10 RETURNING id
    `;
    const r = await client.query({
      text: q,
      values: [
        payload.nome,
        payload.telefone,
        payload.email,
        payload.crp,
        payload.dt_nascimento,
        payload.dt_entrada,
        payload.chave_pix,
        payload.foto,
        payload.curriculo_arquivo,
        existing.id,
      ],
    });
    return r.rows[0].id;
  } else {
    const q = `
      INSERT INTO terapeutas (nome, telefone, email, crp, dt_nascimento, dt_entrada, chave_pix, foto, curriculo_arquivo)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id
    `;
    const r = await client.query({
      text: q,
      values: [
        payload.nome,
        payload.telefone,
        payload.email,
        payload.crp,
        payload.dt_nascimento,
        payload.dt_entrada,
        payload.chave_pix,
        payload.foto,
        payload.curriculo_arquivo,
      ],
    });
    return r.rows[0].id;
  }
}

async function resolveTerapeutaId(client, p) {
  const id = toStr(p.terapeuta_id);
  if (id && isUUID(id)) return id;
  // Se id inválido mas houver terapeuta_email, não emitir aviso (silenciar)
  if (id && !isUUID(id) && debug && !toStr(p.terapeuta_email)) {
    console.warn(
      `⚠️ terapeuta_id inválido (não UUID) para paciente "${toStr(p.nome)}": "${id}". Tentando resolver por terapeuta_email...`,
    );
  }
  const email = normEmail(p.terapeuta_email);
  if (!email) return null;
  const r = await client.query({
    text: "SELECT id FROM terapeutas WHERE LOWER(email) = $1 LIMIT 1",
    values: [email],
  });
  return r.rows[0]?.id || null;
}

async function upsertPaciente(client, p) {
  const terapeutaId = await resolveTerapeutaId(client, p);
  if (!terapeutaId) {
    throw new Error(
      `Paciente "${toStr(p.nome)}": terapeuta não encontrado (terapeuta_email/terapeuta_id)`,
    );
  }

  const cpf = normCPF(p.cpf_responsavel);
  const res = await client.query({
    text: "SELECT id FROM pacientes WHERE cpf_responsavel = $1 LIMIT 1",
    values: [cpf],
  });
  const existing = res.rows[0];

  const payload = {
    nome: toStr(p.nome),
    dt_nascimento:
      toDateOrNull(p.dt_nascimento) ||
      toDateOrNull(DEFAULTS.paciente_dt_nascimento),
    terapeuta_id: terapeutaId,
    nome_responsavel:
      toStr(p.nome_responsavel) || DEFAULTS.paciente_nome_responsavel,
    telefone_responsavel:
      normPhone(p.telefone_responsavel) ||
      DEFAULTS.paciente_telefone_responsavel,
    email_responsavel: normEmail(p.email_responsavel),
    cpf_responsavel: cpf,
    endereco_responsavel: toStr(p.endereco_responsavel),
    origem: normOrigem(p.origem),
    dt_entrada:
      toDateOrNull(p.dt_entrada) ||
      toDateOrNull(DEFAULTS.paciente_dt_entrada) ||
      new Date(),
  };

  if (existing) {
    const q = `
      UPDATE pacientes
      SET nome=$1, dt_nascimento=$2, terapeuta_id=$3, nome_responsavel=$4, telefone_responsavel=$5,
          email_responsavel=$6, endereco_responsavel=$7, origem=$8, dt_entrada=$9, updated_at=NOW()
      WHERE id=$10 RETURNING id
    `;
    const r = await client.query({
      text: q,
      values: [
        payload.nome,
        payload.dt_nascimento,
        payload.terapeuta_id,
        payload.nome_responsavel,
        payload.telefone_responsavel,
        payload.email_responsavel,
        payload.endereco_responsavel,
        payload.origem,
        payload.dt_entrada,
        existing.id,
      ],
    });
    return r.rows[0].id;
  } else {
    const q = `
      INSERT INTO pacientes (
        nome, dt_nascimento, terapeuta_id, nome_responsavel, telefone_responsavel,
        email_responsavel, cpf_responsavel, endereco_responsavel, origem, dt_entrada
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id
    `;
    const r = await client.query({
      text: q,
      values: [
        payload.nome,
        payload.dt_nascimento,
        payload.terapeuta_id,
        payload.nome_responsavel,
        payload.telefone_responsavel,
        payload.email_responsavel,
        payload.cpf_responsavel,
        payload.endereco_responsavel,
        payload.origem,
        payload.dt_entrada,
      ],
    });
    return r.rows[0].id;
  }
}

async function main() {
  console.log(`📄 Lendo: ${file}`);
  const wb = xlsx.readFile(path.resolve(process.cwd(), file), {
    cellDates: true,
  });
  const terapeutasRows = parseSheet(wb.Sheets["Terapeutas"]);
  const pacientesRows = parseSheet(wb.Sheets["Pacientes"]);

  const errors = [];

  // Validações
  const terReq = ["nome", "telefone", "email"];
  terapeutasRows.forEach((r, i) => {
    const e = requireFields(r, terReq, `Terapeuta (linha ${i + 2})`);
    if (e) errors.push(e);
  });

  // dt_nascimento é NOT NULL na tabela "pacientes"; exigir na planilha
  const pacReq = [
    "nome",
    "email_responsavel",
    "cpf_responsavel",
    "endereco_responsavel",
  ];
  pacientesRows.forEach((r, i) => {
    const e = requireFields(r, pacReq, `Paciente (linha ${i + 2})`);
    const hasEmail = !!toStr(r.terapeuta_email);
    const hasId = !!toStr(r.terapeuta_id);
    if (!hasEmail && !hasId) {
      errors.push(
        `Paciente (linha ${i + 2}) faltando terapeuta_email ou terapeuta_id`,
      );
    }
    if (hasId && !isUUID(r.terapeuta_id)) {
      // Só gera erro se não houver terapeuta_email para fallback; caso contrário, silenciar
      if (!hasEmail) {
        errors.push(
          `Paciente (linha ${i + 2}) terapeuta_id inválido (não UUID) e sem terapeuta_email para fallback`,
        );
      }
    }
    if (e) errors.push(e);
  });

  if (errors.length) {
    console.error("❌ Erros de validação:");
    errors.forEach((e) => console.error(" - " + e));
    process.exit(1);
  }

  if (!apply) {
    console.log(
      `🧪 Dry-run OK. Terapeutas: ${terapeutasRows.length}, Pacientes: ${pacientesRows.length}. Use --apply para gravar.`,
    );
    return;
  }

  // Usar um único client/transaction para todo o processo (consistente e mais rápido)
  let client;
  try {
    client = await database.getNewClient();
    if (debug) console.log("🔌 Conexão estabelecida.");

    await client.query("BEGIN");

    // Upsert Terapeutas
    for (const t of terapeutasRows) {
      await upsertTerapeuta(client, t);
    }

    // Upsert Pacientes
    for (const p of pacientesRows) {
      await upsertPaciente(client, p);
    }

    await client.query("COMMIT");
    console.log("✅ Importação concluída.");
  } catch (e) {
    // Tentar capturar erros detalhados do Postgres
    const base = e.cause || e;
    const details = [base?.message, base?.detail, base?.hint, base?.code]
      .filter(Boolean)
      .join(" | ");
    try {
      await client?.query("ROLLBACK");
    } catch (rollbackErr) {
      // ignore rollback errors
    }
    console.error("❌ Falha na importação:", details || e.message || e);
    process.exit(1);
  } finally {
    await client?.end().catch(() => {});
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
