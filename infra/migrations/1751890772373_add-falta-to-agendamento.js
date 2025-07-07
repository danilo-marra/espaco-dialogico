/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  // Adicionar coluna 'falta' à tabela agendamentos
  pgm.addColumn("agendamentos", {
    falta: {
      type: "boolean",
      notNull: false,
      default: false,
      comment: "Indica se o paciente faltou ou remarcou com menos de 24h",
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  // Remover coluna 'falta' da tabela agendamentos
  pgm.dropColumn("agendamentos", "falta");
};
