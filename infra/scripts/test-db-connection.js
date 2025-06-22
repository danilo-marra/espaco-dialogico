const { Pool } = require("pg");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(process.cwd(), ".env.development") });

async function testDatabaseConnection() {
  console.log("🔍 Testando conexão com o banco de dados...");

  const config = {
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
    max: 1,
  };

  console.log("📋 Configuração de conexão:");
  console.log(`   Host: ${config.host}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   Database: ${config.database}`);
  console.log(`   User: ${config.user}`);
  console.log(`   Password: ${config.password ? "***" : "NÃO DEFINIDA"}`);

  const pool = new Pool(config);

  let client;
  try {
    console.log("🔌 Tentando conectar...");
    client = await pool.connect();
    console.log("✅ Conexão estabelecida com sucesso!");

    // Testar uma query simples
    const result = await client.query(
      "SELECT NOW() as current_time, version() as pg_version",
    );
    console.log("📅 Hora atual do banco:", result.rows[0].current_time);
    console.log(
      "🐘 Versão do PostgreSQL:",
      result.rows[0].pg_version.split(" ")[0],
    );

    // Listar todas as tabelas
    const tablesResult = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

    console.log("📊 Tabelas no banco de dados:");
    if (tablesResult.rows.length === 0) {
      console.log("   ⚠️ Nenhuma tabela encontrada");
    } else {
      tablesResult.rows.forEach((row) => {
        console.log(`   - ${row.tablename}`);
      });
    }

    // Verificar especificamente a tabela transacoes
    const transacoesExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'transacoes'
      );
    `);

    if (transacoesExists.rows[0].exists) {
      console.log("✅ Tabela 'transacoes' encontrada!");

      // Contar registros na tabela transacoes
      const countResult = await client.query(
        "SELECT COUNT(*) as total FROM transacoes",
      );
      console.log(
        `📊 Total de registros na tabela 'transacoes': ${countResult.rows[0].total}`,
      );
    } else {
      console.log("❌ Tabela 'transacoes' NÃO encontrada!");
      console.log("💡 Execute 'npm run migrations:up' para criar as tabelas");
    }
  } catch (error) {
    console.error("❌ Erro na conexão:", error.message);

    if (error.code === "ECONNREFUSED") {
      console.log("💡 Possíveis soluções:");
      console.log("   1. Verifique se o Docker está rodando: docker --version");
      console.log("   2. Inicie os serviços: docker-compose up -d");
      console.log("   3. Verifique se o PostgreSQL está rodando: docker ps");
      console.log("   4. Verifique os logs: docker-compose logs postgres");
    } else if (error.code === "ENOTFOUND") {
      console.log("💡 Host não encontrado. Verifique:");
      console.log("   1. Se o valor de POSTGRES_HOST está correto");
      console.log("   2. Se o Docker está rodando na rede correta");
    } else if (error.message.includes("password authentication failed")) {
      console.log("💡 Falha na autenticação. Verifique:");
      console.log("   1. Se POSTGRES_USER e POSTGRES_PASSWORD estão corretos");
      console.log("   2. Se as variáveis estão no arquivo .env.development");
    }

    process.exit(1);
  } finally {
    if (client) {
      try {
        client.release();
        console.log("🔌 Conexão liberada");
      } catch (releaseError) {
        console.warn("⚠️ Erro ao liberar conexão:", releaseError.message);
      }
    }

    try {
      await pool.end();
      console.log("🏁 Pool de conexões fechado");
    } catch (poolError) {
      console.warn("⚠️ Erro ao fechar pool:", poolError.message);
    }
  }
}

testDatabaseConnection();
