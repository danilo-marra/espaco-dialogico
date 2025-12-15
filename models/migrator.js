// Wrapper CommonJS para o migrator ESM
// Este arquivo permite que o código CommonJS use o migrator ESM
// e fornece um mock em ambiente de teste para evitar problemas com node-pg-migrate

// Em ambiente de teste (Jest), retorna mock para evitar carregamento do node-pg-migrate
// que é um módulo ESM puro e causa erros de SyntaxError no Jest
if (
  process.env.NODE_ENV === "test" ||
  process.env.JEST_WORKER_ID !== undefined
) {
  // Mock: retorna arrays vazios para todas as operações
  const migrator = {
    async listPendingMigrations() {
      return [];
    },
    async runPendingMigrations() {
      return [];
    },
    async runSpecificMigration(_migrationName) {
      return [];
    },
  };
  module.exports = migrator;
} else {
  // Produção/Desenvolvimento: carrega o migrator ESM real dinamicamente
  let migratorPromise = null;

  // Wrapper que delega todas as chamadas para o migrator real
  const migrator = {
    async listPendingMigrations() {
      if (!migratorPromise) {
        // Dynamic import do módulo ESM
        migratorPromise = import("./migrator.mjs").then((mod) => mod.default);
      }
      const m = await migratorPromise;
      return m.listPendingMigrations();
    },
    async runPendingMigrations() {
      if (!migratorPromise) {
        migratorPromise = import("./migrator.mjs").then((mod) => mod.default);
      }
      const m = await migratorPromise;
      return m.runPendingMigrations();
    },
    async runSpecificMigration(migrationName) {
      if (!migratorPromise) {
        migratorPromise = import("./migrator.mjs").then((mod) => mod.default);
      }
      const m = await migratorPromise;
      return m.runSpecificMigration(migrationName);
    },
  };

  module.exports = migrator;
}
