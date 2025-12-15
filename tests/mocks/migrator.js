// Mock do migrator para evitar importação do node-pg-migrate durante os testes
const migrator = {
  listPendingMigrations: jest.fn(async () => []),
  runPendingMigrations: jest.fn(async () => []),
  runSpecificMigration: jest.fn(async () => []),
};

export default migrator;
module.exports = migrator;
