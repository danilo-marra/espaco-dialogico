const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const dotenvExpand = require("dotenv-expand");

// Permitir passar arquivo .env como primeiro argumento (default: .env.development.local)
const envFile = process.argv[2] || ".env.development.local";
const envPath = path.resolve(process.cwd(), envFile);
if (fs.existsSync(envPath)) {
  const cfg = dotenv.config({ path: envPath });
  dotenvExpand.expand(cfg);
  process.env.LOADED_ENV_FILE = envFile;
  console.log(`🔧 Variáveis carregadas de ${envFile}`);
} else {
  console.warn(
    `⚠️ Arquivo de ambiente '${envFile}' não encontrado. Prosseguindo com variáveis existentes.`,
  );
}

// Importando migrator com caminho relativo correto
const migrator = require(path.resolve(process.cwd(), "models/migrator.js"));

console.log("Executando migrações automaticamente...");
console.log(`NODE_ENV: ${process.env.NODE_ENV || "não definido"}`);
console.log(`ENV file: ${process.env.LOADED_ENV_FILE || "não aplicado"}`);
console.log(
  `Variáveis de admin definidas: ${Boolean(process.env.ADMIN_USERNAME && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD)}`,
);

// Executar todas as migrações pendentes
async function runMigrations() {
  try {
    // Listar migrações pendentes primeiro
    const pendingMigrations = await migrator.listPendingMigrations();
    console.log(`Migrações pendentes encontradas: ${pendingMigrations.length}`);

    if (pendingMigrations.length > 0) {
      pendingMigrations.forEach((migration) => {
        console.log(`- ${migration.name}`);
      });
    }

    // Executar migrações pendentes
    const result = await migrator.runPendingMigrations();
    console.log(`Migrações executadas: ${result.length}`);

    if (result.length > 0) {
      result.forEach((migration) => {
        console.log(`✓ ${migration.name}`);
      });
    }

    console.log("Migrações concluídas com sucesso!");
  } catch (error) {
    console.error(`Erro ao executar migrações: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

runMigrations();
