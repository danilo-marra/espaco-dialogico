const { resolve } = require("node:path");
const database = require("../infra/database.js");

async function getMigrate() {
  // Tenta carregar o módulo usando dynamic import
  try {
    const pgMigrateModule = await import("node-pg-migrate");
    return pgMigrateModule.default || pgMigrateModule;
  } catch (error) {
    // Fallback: tenta usar require tradicional
    console.warn("Dynamic import falhou, usando require tradicional");
    return require("node-pg-migrate");
  }
}

const defaultMigrationOptions = {
  dryRun: false,
  dir: resolve("infra", "migrations"),
  direction: "up",
  log: () => {}, // Silenciado para não poluir os logs de teste
  migrationsTable: "pgmigrations",
};

async function listPendingMigrations() {
  let dbClient;

  try {
    const pgMigrateModule = await getMigrate();
    const migrate =
      typeof pgMigrateModule === "function"
        ? pgMigrateModule
        : pgMigrateModule.default;
    dbClient = await database.getNewClient();
    const pendingMigrations = await migrate({
      ...defaultMigrationOptions,
      dryRun: true,
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
    const pgMigrateModule = await getMigrate();
    const migrate =
      typeof pgMigrateModule === "function"
        ? pgMigrateModule
        : pgMigrateModule.default;
    dbClient = await database.getNewClient();
    const migratedMigrations = await migrate({
      ...defaultMigrationOptions,
      dbClient,
    });

    return migratedMigrations;
  } finally {
    await dbClient?.end();
  }
}

async function runSpecificMigration(migrationName) {
  let dbClient;

  try {
    const pgMigrateModule = await getMigrate();
    const migrate =
      typeof pgMigrateModule === "function"
        ? pgMigrateModule
        : pgMigrateModule.default;
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
  runSpecificMigration,
};

module.exports = migrator;
