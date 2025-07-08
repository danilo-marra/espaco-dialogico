const { Pool } = require("pg");
const dotenv = require("dotenv");
const path = require("path");

function loadEnvFile(envFile) {
  const envPath = path.resolve(process.cwd(), envFile);
  console.log(`📁 Carregando configurações de: ${envPath}`);

  // Limpar variáveis de ambiente anteriores relacionadas ao PostgreSQL
  delete process.env.POSTGRES_HOST;
  delete process.env.POSTGRES_PORT;
  delete process.env.POSTGRES_USER;
  delete process.env.POSTGRES_DB;
  delete process.env.POSTGRES_PASSWORD;
  delete process.env.POSTGRES_CA;
  delete process.env.NODE_ENV;

  dotenv.config({ path: envPath });

  // Definir NODE_ENV baseado no arquivo de ambiente
  if (envFile.includes("production")) {
    process.env.NODE_ENV = "production";
  } else if (envFile.includes("staging")) {
    process.env.NODE_ENV = "staging";
  } else {
    process.env.NODE_ENV = "development";
  }

  console.log(`🔧 NODE_ENV definido como: ${process.env.NODE_ENV}`);
}

async function syncMigrationTimestamps(envFile) {
  loadEnvFile(envFile);

  const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT || 5432,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    ssl: process.env.POSTGRES_HOST !== "localhost",
  });

  console.log(`🔄 Sincronizando timestamps de migrações para: ${envFile}`);
  console.log(`Ambiente: ${envFile}`);
  console.log(`Banco: ${process.env.POSTGRES_DB}`);
  console.log(`Host: ${process.env.POSTGRES_HOST}`);

  let client;
  try {
    client = await pool.connect();

    // Verificar se as migrações antigas existem
    const oldMigrations = await client.query(`
      SELECT name FROM pgmigrations 
      WHERE name IN (
        '20250707082424_make-paciente-fields-optional',
        '1751900000000_remove-curriculo-from-terapeutas'
      )
      ORDER BY name
    `);

    console.log(
      `📋 Migrações antigas encontradas: ${oldMigrations.rows.length}`,
    );
    oldMigrations.rows.forEach((row) => {
      console.log(`  - ${row.name}`);
    });

    // Verificar se as migrações novas já foram aplicadas
    const newMigrations = await client.query(`
      SELECT name FROM pgmigrations 
      WHERE name IN (
        '1751979228692_make-paciente-fields-optional',
        '1751979244388_remove-curriculo-from-terapeutas'
      )
      ORDER BY name
    `);

    console.log(`📋 Migrações novas encontradas: ${newMigrations.rows.length}`);
    newMigrations.rows.forEach((row) => {
      console.log(`  - ${row.name}`);
    });

    // Se as migrações antigas existem mas as novas não, precisamos aplicar as novas
    if (oldMigrations.rows.length > 0 && newMigrations.rows.length === 0) {
      console.log("🚀 Aplicando migrações de correção de timestamp...");

      // Importar o migrator diretamente para usar as configurações corretas do ambiente
      const migrator = require(
        path.resolve(process.cwd(), "models/migrator.js"),
      );

      try {
        console.log("📦 Executando migrações pendentes...");
        const migratedMigrations = await migrator.runPendingMigrations();

        if (migratedMigrations.length > 0) {
          console.log("✅ Migrações aplicadas com sucesso!");
          console.log(`📊 Migrações executadas: ${migratedMigrations.length}`);
          migratedMigrations.forEach((migration) => {
            console.log(`  ✓ ${migration.name || migration}`);
          });
        } else {
          console.log("ℹ️ Nenhuma migração pendente encontrada");
        }
      } catch (error) {
        console.error("❌ Erro ao aplicar migrações:", error.message);
        throw error;
      }
    } else if (newMigrations.rows.length > 0) {
      console.log("✅ Migrações de correção já foram aplicadas!");
    } else {
      console.log(
        "ℹ️ Nenhuma migração de correção necessária (ambiente limpo)",
      );
    }
  } catch (error) {
    console.error(`❌ Erro ao sincronizar migrações: ${error.message}`);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Usar o ambiente passado como argumento ou .env.development.local como padrão
const envFile = process.argv[2] || ".env.development.local";

syncMigrationTimestamps(envFile)
  .then(() => {
    console.log("🎉 Sincronização concluída!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Falha na sincronização:", error.message);
    process.exit(1);
  });
