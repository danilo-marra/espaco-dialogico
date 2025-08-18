const dotenv = require("dotenv");
const dotenvExpand = require("dotenv-expand");
const fs = require("fs");
const path = require("path");

const argv = process.argv.slice(2);
function arg(flag) {
  const i = argv.indexOf(flag);
  return i >= 0 ? argv[i + 1] : undefined;
}
const defaultEnv = fs.existsSync(path.resolve(process.cwd(), ".env.local"))
  ? ".env.local"
  : ".env.development.local";
const envPath = arg("--env") || defaultEnv;
const myEnv = dotenv.config({ path: path.resolve(process.cwd(), envPath) });
dotenvExpand.expand(myEnv);

// Carregar database somente após carregar/expandir o .env
const database = require("../database.js");

async function main() {
  const t = await database.query("SELECT COUNT(*) FROM terapeutas");
  const p = await database.query("SELECT COUNT(*) FROM pacientes");
  console.log("Terapeutas:", t.rows[0].count, "Pacientes:", p.rows[0].count);

  const ultT = await database.query(
    "SELECT id, nome, email FROM terapeutas ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST LIMIT 5",
  );
  console.log("Últimos terapeutas:", ultT.rows);

  const ultP = await database.query(
    "SELECT id, nome, cpf_responsavel FROM pacientes ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST LIMIT 5",
  );
  console.log("Últimos pacientes:", ultP.rows);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
