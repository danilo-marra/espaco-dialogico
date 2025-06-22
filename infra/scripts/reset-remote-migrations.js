const { Pool } = require("pg");
const { execSync } = require("child_process");
const dotenv = require("dotenv");
const path = require("path");
const readline = require("readline");

// Carrega variáveis de ambiente específicas do ambiente
const envFile = process.argv[2] || ".env.production";
const envPath = path.resolve(process.cwd(), envFile);

console.log(`📁 Carregando configurações de: ${envPath}`);
dotenv.config({ path: envPath });

console.log("🔄 Iniciando reset das migrações remotas...");
console.log(`Ambiente: ${envFile}`);
console.log(`Banco: ${process.env.POSTGRES_DB}`);
console.log(`Host: ${process.env.POSTGRES_HOST}`);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function resetRemoteMigrations() {
  const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT || 5432,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    ssl: process.env.POSTGRES_HOST !== "localhost", // SSL para Neon, não para localhost
  });

  let client;
  try {
    client = await pool.connect();

    console.log("📊 Verificando estado atual do banco...");

    // Listar tabelas existentes
    const { rows: tables } = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

    console.log(`🗂️ Tabelas encontradas: ${tables.length}`);
    tables.forEach((table) => console.log(`  - ${table.tablename}`));

    // Verificar migrações aplicadas se a tabela existir
    let migrations = [];
    try {
      const { rows } = await client.query(`
        SELECT name, run_on 
        FROM pgmigrations 
        ORDER BY run_on DESC
        LIMIT 10;
      `);
      migrations = rows;
    } catch (error) {
      console.log("ℹ️ Tabela de migrações não encontrada");
    }

    console.log(`📝 Últimas migrações aplicadas: ${migrations.length}`);
    migrations.forEach((migration) => {
      console.log(`  - ${migration.name} (${migration.run_on})`);
    });

    // Confirmar antes de resetar
    console.log("\n⚠️ ATENÇÃO: Esta operação irá:");
    console.log("   1. Apagar TODOS os dados do banco");
    console.log("   2. Remover TODAS as tabelas");
    console.log("   3. Resetar o histórico de migrações");

    let confirmation;
    if (process.env.FORCE_RESET === "CONFIRMAR") {
      confirmation = "CONFIRMAR";
      console.log("✅ Auto-confirmação ativada via variável de ambiente");
    } else {
      confirmation = await question(
        "\n❓ Digite 'CONFIRMAR' para prosseguir ou qualquer outra coisa para cancelar: ",
      );
    }

    if (confirmation !== "CONFIRMAR") {
      console.log("❌ Operação cancelada pelo usuário");
      return;
    }

    console.log("\n🗑️ Executando reset completo do banco...");

    // Drop e recria o schema público (remove tudo)
    await client.query("DROP SCHEMA public CASCADE;");
    await client.query("CREATE SCHEMA public;");
    await client.query("GRANT ALL ON SCHEMA public TO public;");

    console.log("✅ Reset do banco concluído!");
  } catch (error) {
    console.error("❌ Erro durante o reset:", error.message);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

async function runMigrationsAfterReset() {
  try {
    console.log("\n🚀 Executando migrações no banco limpo...");

    // Criar um arquivo temporário de ambiente para as migrações
    const tempEnvPath = path.resolve(process.cwd(), ".env.temp");
    const fs = require("fs");

    // Construir DATABASE_URL com SSL se não for localhost
    let databaseUrl = process.env.DATABASE_URL;
    if (
      process.env.POSTGRES_HOST !== "localhost" &&
      !databaseUrl.includes("sslmode")
    ) {
      databaseUrl = `${databaseUrl}${databaseUrl.includes("?") ? "&" : "?"}sslmode=require`;
    }

    const envContent = `
DATABASE_URL=${databaseUrl}
POSTGRES_HOST=${process.env.POSTGRES_HOST}
POSTGRES_PORT=${process.env.POSTGRES_PORT}
POSTGRES_USER=${process.env.POSTGRES_USER}
POSTGRES_DB=${process.env.POSTGRES_DB}
POSTGRES_PASSWORD=${process.env.POSTGRES_PASSWORD}
JWT_SECRET=${process.env.JWT_SECRET}
ADMIN_USERNAME=${process.env.ADMIN_USERNAME}
ADMIN_EMAIL=${process.env.ADMIN_EMAIL}
ADMIN_PASSWORD=${process.env.ADMIN_PASSWORD}
PGSSL=require
PGSSLMODE=require
`.trim();

    fs.writeFileSync(tempEnvPath, envContent);

    console.log(
      "🔗 DATABASE_URL configurada:",
      databaseUrl.replace(/:[^:@]*@/, ":***@"),
    );

    // Executar migrações usando node-pg-migrate diretamente
    execSync(`npx node-pg-migrate -m infra/migrations --envPath .env.temp up`, {
      stdio: "inherit",
      env: {
        ...process.env,
        NODE_ENV: "production",
        DATABASE_URL: databaseUrl,
        PGSSL: "require",
        PGSSLMODE: "require",
      },
    });

    // Limpar arquivo temporário
    fs.unlinkSync(tempEnvPath);

    console.log("✅ Migrações aplicadas com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao executar migrações:", error.message);
    throw error;
  }
}

async function verifyReset() {
  const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT || 5432,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    ssl: process.env.POSTGRES_HOST !== "localhost",
  });

  let client;
  try {
    client = await pool.connect();

    console.log("\n📊 Verificando estado final do banco...");

    // Verificar tabelas criadas
    const { rows: tables } = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

    console.log(`✅ Tabelas criadas: ${tables.length}`);
    tables.forEach((table) => console.log(`  - ${table.tablename}`));

    // Verificar usuário admin se a tabela users existir
    try {
      const { rows: adminUsers } = await client.query(`
        SELECT username, email, role 
        FROM users 
        WHERE role = 'admin'
      `);

      console.log(`👤 Usuários admin: ${adminUsers.length}`);
      adminUsers.forEach((user) => {
        console.log(`  - ${user.username} (${user.email})`);
      });
    } catch (error) {
      console.log("ℹ️ Tabela users ainda não foi criada ou não possui dados");
    }
  } catch (error) {
    console.error("❌ Erro na verificação:", error.message);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

async function main() {
  try {
    await resetRemoteMigrations();
    await runMigrationsAfterReset();
    await verifyReset();

    console.log("\n🎉 Reset e recriação das migrações concluído com sucesso!");
  } catch (error) {
    console.error("\n❌ Erro durante o processo:", error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
