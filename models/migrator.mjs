import { resolve } from "node:path";
import database from "../infra/database.mjs";

async function getMigrate() {
  try {
    const mod = await import("node-pg-migrate");

    // node-pg-migrate >= 6.x exporta a função runner
    if (mod && typeof mod.runner === "function") {
      return mod.runner;
    }

    // Fallback para versões antigas com default export
    if (mod && typeof mod.default === "function") {
      return mod.default;
    }

    throw new Error(
      "node-pg-migrate não exporta nem runner nem default como função",
    );
  } catch (error) {
    console.error("Erro ao carregar node-pg-migrate:", error.message);
    throw error;
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
    const runMigration = await getMigrate();
    dbClient = await database.getNewClient();
    const pendingMigrations = await runMigration({
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
    const runMigration = await getMigrate();
    dbClient = await database.getNewClient();
    const migratedMigrations = await runMigration({
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
    const runMigration = await getMigrate();
    dbClient = await database.getNewClient();
    const result = await runMigration({
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

export default migrator;
