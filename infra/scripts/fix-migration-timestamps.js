const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

// Carrega variáveis de ambiente específicas do ambiente
const envFile = process.argv[2] || ".env.development.local";
const envPath = path.resolve(process.cwd(), envFile);

console.log(`📁 Carregando configurações de: ${envPath}`);
dotenv.config({ path: envPath });

const MIGRATIONS_TO_FIX = [
  {
    oldName: "20250707082424_make-paciente-fields-optional.js",
    newName: "1751979228692_make-paciente-fields-optional.js",
    oldTimestamp: "20250707082424",
    newTimestamp: "1751979228692",
  },
  {
    oldName: "1751900000000_remove-curriculo-from-terapeutas.js",
    newName: "1751979244388_remove-curriculo-from-terapeutas.js",
    oldTimestamp: "1751900000000",
    newTimestamp: "1751979244388",
  },
];

async function fixMigrationTimestamps() {
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

    console.log("🔍 Verificando migrações existentes...");

    // Verificar se a tabela de migrações existe
    const { rows: tableExists } = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'pgmigrations'
      );
    `);

    if (!tableExists[0].exists) {
      console.log(
        "❌ Tabela de migrações não encontrada. Execute as migrações primeiro.",
      );
      return;
    }

    // Verificar quais migrações problemáticas existem
    const { rows: existingMigrations } = await client.query(
      `
      SELECT name, run_on 
      FROM pgmigrations 
      WHERE name IN ($1, $2)
      ORDER BY run_on;
    `,
      [MIGRATIONS_TO_FIX[0].oldTimestamp, MIGRATIONS_TO_FIX[1].oldTimestamp],
    );

    console.log(
      `📊 Migrações problemáticas encontradas: ${existingMigrations.length}`,
    );
    existingMigrations.forEach((migration) => {
      console.log(`  - ${migration.name} (executada em: ${migration.run_on})`);
    });

    if (existingMigrations.length === 0) {
      console.log("✅ Nenhuma migração problemática encontrada no banco.");
      return;
    }

    console.log("\n🔄 Iniciando correção dos timestamps...");

    // Para cada migração problemática encontrada
    for (const existingMigration of existingMigrations) {
      const migrationToFix = MIGRATIONS_TO_FIX.find(
        (m) => m.oldTimestamp === existingMigration.name,
      );

      if (migrationToFix) {
        console.log(`\n📝 Corrigindo: ${migrationToFix.oldName}`);
        console.log(`   De: ${migrationToFix.oldTimestamp}`);
        console.log(`   Para: ${migrationToFix.newTimestamp}`);

        // Atualizar o nome da migração na tabela
        await client.query(
          `
          UPDATE pgmigrations 
          SET name = $1 
          WHERE name = $2
        `,
          [migrationToFix.newTimestamp, migrationToFix.oldTimestamp],
        );

        console.log(`   ✅ Timestamp atualizado no banco de dados`);
      }
    }

    console.log("\n📋 Estado final das migrações:");
    const { rows: finalMigrations } = await client.query(`
      SELECT name, run_on 
      FROM pgmigrations 
      ORDER BY run_on DESC
      LIMIT 10;
    `);

    finalMigrations.forEach((migration) => {
      console.log(`  - ${migration.name} (${migration.run_on})`);
    });
  } catch (error) {
    console.error("❌ Erro durante a correção:", error.message);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

async function removeOldMigrationFiles() {
  console.log(
    "\n🗑️ Removendo arquivos de migração com timestamps incorretos...",
  );

  const migrationsDir = path.resolve(process.cwd(), "infra", "migrations");

  for (const migration of MIGRATIONS_TO_FIX) {
    const oldFilePath = path.join(migrationsDir, migration.oldName);

    if (fs.existsSync(oldFilePath)) {
      console.log(`   Removendo: ${migration.oldName}`);
      fs.unlinkSync(oldFilePath);
      console.log(`   ✅ Arquivo removido`);
    } else {
      console.log(`   ⚠️ Arquivo não encontrado: ${migration.oldName}`);
    }
  }
}

async function main() {
  try {
    console.log("🚀 Iniciando correção de timestamps das migrações...");
    console.log(`Ambiente: ${envFile}`);
    console.log(`Banco: ${process.env.POSTGRES_DB}`);
    console.log(`Host: ${process.env.POSTGRES_HOST}`);

    await fixMigrationTimestamps();
    await removeOldMigrationFiles();

    console.log("\n🎉 Correção de timestamps concluída com sucesso!");
    console.log("\n📝 Próximos passos:");
    console.log(
      "1. Execute este script nos outros ambientes (staging/produção)",
    );
    console.log(
      "2. Certifique-se de que todas as instâncias usem os arquivos com timestamps corretos",
    );
    console.log(
      "3. Execute 'npm run migrations:up' para confirmar que tudo está funcionando",
    );
  } catch (error) {
    console.error("\n❌ Erro durante o processo:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  fixMigrationTimestamps,
  removeOldMigrationFiles,
  MIGRATIONS_TO_FIX,
};
