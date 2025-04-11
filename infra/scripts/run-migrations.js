const path = require("path");
const dotenv = require("dotenv");

// Configurando caminho correto para as variáveis de ambiente
dotenv.config({ path: path.resolve(process.cwd(), ".env.development.local") });

// Importando migrator com caminho relativo correto (sem .default pois agora usamos CommonJS)
const migrator = require(path.resolve(process.cwd(), "models/migrator.js"));

console.log("Executando migrações automaticamente...");
console.log(`NODE_ENV: ${process.env.NODE_ENV || "não definido"}`);
console.log(
  `Variáveis de admin definidas: ${Boolean(process.env.ADMIN_USERNAME && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD)}`,
);

// Executar todas as migrações pendentes
async function runMigrations() {
  try {
    // Listar migrações pendentes primeiro
    const pendingMigrations = await migrator.listPendingMigrations();
    console.log(`Migrações pendentes encontradas: ${pendingMigrations.length}`);

    if (pendingMigrations.length > 0) {
      pendingMigrations.forEach((migration) => {
        console.log(`- ${migration.name}`);
      });
    }

    // Executar migrações pendentes
    const result = await migrator.runPendingMigrations();
    console.log(`Migrações executadas: ${result.length}`);

    // Se a migração de admin não estiver entre as executadas, forçar sua execução
    const adminMigration = "1744376265470_update-admin-from-env";
    if (!result.some((m) => m.name.includes(adminMigration))) {
      console.log(`Forçando execução da migração: ${adminMigration}`);
      await migrator.runSpecificMigration(adminMigration);
      console.log(`Migração de admin executada manualmente.`);
    }

    console.log("Migrações concluídas com sucesso!");
  } catch (error) {
    console.error(`Erro ao executar migrações: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

runMigrations();
