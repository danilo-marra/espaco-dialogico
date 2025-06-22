const { execSync } = require("child_process");
const { Pool } = require("pg");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(process.cwd(), ".env.development") });

async function validateAndFixDatabase() {
  console.log("🔍 Validando banco de dados...");

  try {
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

      // Lista de tabelas esperadas
      const requiredTables = [
        "terapeutas",
        "users",
        "invites",
        "pacientes",
        "sessoes",
        "agendamentos",
        "transacoes",
      ];
      const missingTables = [];

      for (const table of requiredTables) {
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

          if (!rows[0].exists) {
            missingTables.push(table);
          }
        } catch (queryError) {
          console.error(
            `❌ Erro ao verificar tabela '${table}':`,
            queryError.message,
          );
          missingTables.push(table);
        }
      }

      if (missingTables.length > 0) {
        console.log(`⚠️ Tabelas ausentes: ${missingTables.join(", ")}`);
        console.log("🔧 Executando migrações para corrigir...");

        try {
          execSync("npm run migrations:up", { stdio: "inherit" });
          console.log("✅ Migrações aplicadas com sucesso!");
        } catch (migrationError) {
          console.error(
            "❌ Erro ao executar migrações:",
            migrationError.message,
          );
          throw migrationError;
        }
      } else {
        console.log("✅ Todas as tabelas estão presentes no banco de dados!");
      }
    } finally {
      if (client) {
        client.release();
      }
      await pool.end();
    }
  } catch (error) {
    console.error("❌ Erro ao validar banco de dados:", error.message);

    if (
      error.message.includes("Connection terminated") ||
      error.message.includes("ECONNREFUSED")
    ) {
      console.log("💡 Problema de conexão com o banco de dados:");
      console.log("   1. Verifique se o Docker está rodando: docker ps");
      console.log("   2. Inicie os serviços: docker-compose up -d");
      console.log("   3. Verifique os logs: docker-compose logs postgres");
      console.log(
        "   4. Aguarde alguns segundos para o PostgreSQL inicializar",
      );
    }

    process.exit(1);
  }
}

validateAndFixDatabase();
