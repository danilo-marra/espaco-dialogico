const { execSync, spawn } = require("child_process");
const { Pool } = require("pg");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

// Carregando variáveis de ambiente
dotenv.config({ path: path.resolve(process.cwd(), ".env.development") });

// Função para extrair nomes de tabelas dos arquivos de migração
function extractTableNames() {
  const migrationsDir = path.resolve(process.cwd(), "infra/migrations");
  const tableNames = new Set();

  try {
    // Lista os arquivos de migração
    const files = fs.readdirSync(migrationsDir);

    for (const file of files) {
      if (!file.endsWith(".js")) continue;

      const filePath = path.join(migrationsDir, file);
      const content = fs.readFileSync(filePath, "utf8");

      // Procura por padrões de criação de tabelas
      // pgm.createTable("nome_tabela", {...})
      const createTableRegex =
        /pgm\.createTable\(\s*["'`]([a-zA-Z0-9_]+)["'`]/g;
      let match;
      while ((match = createTableRegex.exec(content)) !== null) {
        tableNames.add(match[1]);
      }
    }

    return Array.from(tableNames);
  } catch (error) {
    console.error("❌ Erro ao extrair nomes das tabelas:", error.message);
    return ["terapeutas", "users"]; // Fallback para tabelas conhecidas
  }
}

async function validateDatabase() {
  console.log(
    "🔍 Verificando se o banco de dados está configurado corretamente...",
  );

  // Obtem as tabelas que devem existir com base nas migrações
  const expectedTables = extractTableNames();
  console.log(`📋 Tabelas esperadas: ${expectedTables.join(", ")}`);

  const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
  });

  try {
    const client = await pool.connect();
    let needsMigration = false;

    // Verificar cada tabela esperada
    for (const table of expectedTables) {
      const { rows } = await client.query(
        `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = $1
        );
      `,
        [table],
      );

      const tableExists = rows[0].exists;

      if (!tableExists) {
        console.log(`🚨 Tabela '${table}' não encontrada.`);
        needsMigration = true;
      } else {
        console.log(`✅ Tabela '${table}' verificada com sucesso.`);
      }
    }

    // Se alguma tabela estiver faltando, executa as migrações
    if (needsMigration) {
      console.log("🔄 Executando migrações para criar tabelas faltantes...");
      execSync("npm run migrations:up", { stdio: "inherit" });
      console.log("✅ Migrações aplicadas com sucesso!");
    }

    client.release();
    await pool.end();
  } catch (error) {
    console.error("❌ Erro ao verificar o banco de dados:", error.message);
    process.exit(1);
  }
}

// Verificar o estado atual do banco de dados
async function checkDatabaseState() {
  const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
  });

  try {
    const client = await pool.connect();

    // Listar todas as tabelas existentes
    const { rows } = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

    console.log("📊 Tabelas atuais no banco de dados:");
    rows.forEach((row) => console.log(`   - ${row.tablename}`));

    client.release();
    await pool.end();
  } catch (error) {
    console.error(
      "⚠️ Não foi possível listar tabelas existentes:",
      error.message,
    );
  }
}

async function startNextDev() {
  await validateDatabase();
  await checkDatabaseState();

  console.log("🚀 Iniciando o servidor Next.js...");
  const nextProcess = spawn("next", ["dev"], { stdio: "inherit", shell: true });

  nextProcess.on("error", (error) => {
    console.error("❌ Erro ao iniciar Next.js:", error);
    process.exit(1);
  });

  process.on("SIGINT", () => {
    nextProcess.kill("SIGINT");
    process.exit(0);
  });
}

startNextDev();
