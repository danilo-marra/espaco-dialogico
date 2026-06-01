const { Pool } = require("pg");
const dotenv = require("dotenv");
const path = require("path");

// Carregando variáveis de ambiente
const envPath = path.resolve(process.cwd(), ".env.development.local");
dotenv.config({ path: envPath });

async function waitForPostgres() {
  const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    connectionTimeoutMillis: 2000,
  });

  console.log("\n\n🔄 Esperando PostgreSQL ficar disponível...");

  let attempts = 0;
  const maxAttempts = 15;
  const delay = 2000;

  while (attempts < maxAttempts) {
    try {
      attempts++;
      const client = await pool.connect();

      // Testar uma operação real no banco
      await client.query("SELECT 1");

      console.log("\n✅ PostgreSQL está pronto e operacional!\n");
      client.release();
      await pool.end();
      return;
    } catch (error) {
      console.log(
        `⏳ Tentativa ${attempts}/${maxAttempts}: PostgreSQL ainda não está pronto. Aguardando...`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  console.error(
    "\n❌ Falha ao conectar ao PostgreSQL após várias tentativas.\n",
  );
  process.exit(1);
}

waitForPostgres();
