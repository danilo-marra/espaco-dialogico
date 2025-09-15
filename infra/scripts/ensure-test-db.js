const { Client } = require("pg");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const dotenvExpand = require("dotenv-expand");

// Permitir passar um arquivo .env como argumento (default .env.test)
const envFile = process.argv[2] || ".env.test";
const envPath = path.resolve(process.cwd(), envFile);
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.config({ path: envPath });
  dotenvExpand.expand(envConfig);
  console.log(`🔧 Carregado arquivo de ambiente: ${envFile}`);
} else {
  console.warn(`⚠️ Arquivo de ambiente não encontrado: ${envFile}`);
}

const targetDb = process.env.POSTGRES_DB;
if (!targetDb) {
  console.error("❌ POSTGRES_DB não definido no ambiente.");
  process.exit(1);
}

async function ensureTestDatabase() {
  const connInfo = {
    host: process.env.POSTGRES_HOST || "localhost",
    port: Number(process.env.POSTGRES_PORT) || 5432,
    user: process.env.POSTGRES_USER,
    database: "postgres",
  };
  const maxAttempts = Number(process.env.DB_ENSURE_MAX_ATTEMPTS || 20);
  const baseDelay = Number(process.env.DB_ENSURE_DELAY_MS || 1000);
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const adminClient = new Client({
      host: connInfo.host,
      port: connInfo.port,
      user: connInfo.user,
      password: process.env.POSTGRES_PASSWORD,
      database: connInfo.database,
    });
    try {
      console.log(
        `🔗 (Tentativa ${attempt}/${maxAttempts}) Conectando (host=${connInfo.host} port=${connInfo.port} user=${connInfo.user})...`,
      );
      await adminClient.connect();
      console.log("✅ Conexão administrativa estabelecida.");

      const { rows } = await adminClient.query(
        "SELECT 1 FROM pg_database WHERE datname = $1",
        [targetDb],
      );

      if (rows.length) {
        console.log(`✅ Banco de teste '${targetDb}' já existe.`);
      } else {
        console.log(`🛠️ Criando banco de teste '${targetDb}'...`);
        await adminClient.query(`CREATE DATABASE ${targetDb}`);
        console.log("✅ Banco de teste criado com sucesso.");
      }
      return; // sucesso
    } catch (error) {
      console.warn(
        `⚠️ Falha na tentativa ${attempt}: ${error.message} (${error.code || "sem code"})`,
      );
      if (attempt === maxAttempts) {
        console.error("❌ Erro garantindo banco de teste:", error.message);
        console.error("📄 Stack:", error.stack);
        console.error("🧪 Variáveis relevantes:", {
          POSTGRES_HOST: process.env.POSTGRES_HOST,
          POSTGRES_PORT: process.env.POSTGRES_PORT,
          POSTGRES_USER: process.env.POSTGRES_USER,
          TARGET_DB: targetDb,
        });
        process.exit(1);
      }
      await wait(baseDelay * attempt);
    } finally {
      try {
        await adminClient.end();
      } catch (_) {
        /* ignore close errors */
      }
    }
  }
}

ensureTestDatabase();

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
