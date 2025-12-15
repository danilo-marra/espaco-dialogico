const { resolve } = require("node:path");
const database = require("../infra/database.js");

async function getMigrate() {
  const { default: migrate } = await import("node-pg-migrate");
  return migrate;
}

const defaultMigrationOptions = {
  dryRun: false, // Alterado para false para permitir que migrações reais sejam executadas
  dir: resolve("infra", "migrations"),
  direction: "up",
  log: () => console.log, // Adicionado console.log para melhor visibilidade
  migrationsTable: "pgmigrations",
};

async function listPendingMigrations() {
  let dbClient;

  try {
    const migrate = await getMigrate();
    dbClient = await database.getNewClient();
    const pendingMigrations = await migrate({
      ...defaultMigrationOptions,
      dryRun: true, // Para listagem, mantemos dryRun como true
      dbClient,
    });
    return pendingMigrations;
  } finally {
    await dbClient?.end();
  }
}

async function runPendingMigrations() {
  let dbClient;

  try {
    const migrate = await getMigrate();
    dbClient = await database.getNewClient();
    const migratedMigrations = await migrate({
      ...defaultMigrationOptions,
      dbClient,
      // dryRun já é false por padrão agora
    });

    return migratedMigrations;
  } finally {
    await dbClient?.end();
  }
}

// Adiciona nova função para forçar a execução de uma migração específica
async function runSpecificMigration(migrationName) {
  let dbClient;

  try {
    const migrate = await getMigrate();
    dbClient = await database.getNewClient();
    const result = await migrate({
      ...defaultMigrationOptions,
      dbClient,
      migrations: [migrationName],
    });

    return result;
  } finally {
    await dbClient?.end();
  }
}

const migrator = {
  listPendingMigrations,
  runPendingMigrations,
  runSpecificMigration, // Exporta a nova função
};

module.exports = migrator;
