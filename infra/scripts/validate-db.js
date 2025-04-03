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
    });

    const client = await pool.connect();

    // Lista de tabelas esperadas
    const requiredTables = ["terapeutas", "users"];
    const missingTables = [];

    for (const table of requiredTables) {
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
    }

    client.release();
    await pool.end();

    if (missingTables.length > 0) {
      console.log(`⚠️ Tabelas ausentes: ${missingTables.join(", ")}`);
      console.log("🔧 Executando migrações para corrigir...");
      execSync("npm run migrations:up", { stdio: "inherit" });
      console.log("✅ Migrações aplicadas com sucesso!");
    } else {
      console.log("✅ Todas as tabelas estão presentes no banco de dados!");
    }
  } catch (error) {
    console.error("❌ Erro ao validar banco de dados:", error.message);
    process.exit(1);
  }
}

validateAndFixDatabase();
