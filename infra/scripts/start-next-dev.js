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

  const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
    max: 10,
  });

  let client;
  try {
    client = await pool.connect();
    let needsMigration = false;

    // Verificar cada tabela esperada
    for (const table of expectedTables) {
      try {
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
          needsMigration = true;
        }
      } catch (queryError) {
        console.error(
          `❌ Erro ao verificar tabela '${table}':`,
          queryError.message,
        );
        needsMigration = true;
      }
    }

    // Se alguma tabela estiver faltando, executa as migrações
    if (needsMigration) {
      console.log("🔄 Executando migrações para criar tabelas faltantes...");
      try {
        execSync("npm run migrations:up", { stdio: "inherit" });
        console.log("✅ Migrações aplicadas com sucesso!");
      } catch (migrationError) {
        console.error("❌ Erro ao executar migrações:", migrationError.message);
        throw migrationError;
      }
    } else {
      console.log("✅ Banco de dados verificado com sucesso!");
    }
  } catch (error) {
    console.error("❌ Erro ao verificar o banco de dados:", error.message);

    // Tentar diagnóstico adicional
    if (
      error.message.includes("Connection terminated") ||
      error.message.includes("ECONNREFUSED")
    ) {
      console.log("💡 Dicas para resolver o problema:");
      console.log("   1. Verifique se o Docker está rodando");
      console.log("   2. Execute: docker-compose up -d");
      console.log(
        "   3. Verifique as variáveis de ambiente no .env.development",
      );
      console.log(
        "   4. Aguarde alguns segundos para o PostgreSQL inicializar",
      );
    }

    process.exit(1);
  } finally {
    if (client) {
      try {
        client.release();
      } catch (releaseError) {
        console.warn("⚠️ Erro ao liberar conexão:", releaseError.message);
      }
    }

    try {
      await pool.end();
    } catch (poolError) {
      console.warn("⚠️ Erro ao fechar pool de conexões:", poolError.message);
    }
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
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
    max: 5,
  });

  let client;
  try {
    client = await pool.connect();

    // Listar todas as tabelas existentes
    const { rows } = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

    console.log("📊 Tabelas no banco de dados:");
    if (rows.length === 0) {
      console.log("   ⚠️ Nenhuma tabela encontrada no schema 'public'");
    } else {
      console.log(`   ${rows.length} tabelas encontradas`);
    }
  } catch (error) {
    console.error(
      "⚠️ Não foi possível listar tabelas existentes:",
      error.message,
    );

    if (
      error.message.includes("Connection terminated") ||
      error.message.includes("ECONNREFUSED")
    ) {
      console.log("💡 Problema de conexão detectado. Verifique se:");
      console.log("   - O Docker está rodando");
      console.log("   - O PostgreSQL está iniciado");
      console.log("   - As variáveis de ambiente estão corretas");
    }
  } finally {
    if (client) {
      try {
        client.release();
      } catch (releaseError) {
        console.warn("⚠️ Erro ao liberar conexão:", releaseError.message);
      }
    }

    try {
      await pool.end();
    } catch (poolError) {
      console.warn("⚠️ Erro ao fechar pool de conexões:", poolError.message);
    }
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
