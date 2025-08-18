const dotenv = require("dotenv");
const dotenvExpand = require("dotenv-expand");
const fs = require("fs");
const path = require("path");

// Suporte a --env
const argv = process.argv.slice(2);
function arg(flag) {
  const i = argv.indexOf(flag);
  return i >= 0 ? argv[i + 1] : undefined;
}
const defaultEnv = fs.existsSync(path.resolve(process.cwd(), ".env.local"))
  ? ".env.local"
  : ".env.production.local";
const envPath = arg("--env") || defaultEnv;
const myEnv = dotenv.config({ path: path.resolve(process.cwd(), envPath) });
dotenvExpand.expand(myEnv);

// Só depois de carregar o .env
const database = require("../database.js");

async function main() {
  console.log("🔧 Garantindo índices únicos...");
  try {
    await database.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_terapeutas_email_unique
      ON terapeutas (LOWER(email));
    `);
    await database.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_pacientes_cpf_unique
      ON pacientes (cpf_responsavel);
    `);
    console.log("✅ Índices únicos garantidos.");
    process.exit(0);
  } catch (e) {
    console.error("❌ Erro ao criar índices:", e);
    process.exit(1);
  }
}

main();
