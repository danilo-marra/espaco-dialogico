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
  // Adicionar coluna valor_repasse à tabela sessoes
  pgm.addColumn("sessoes", {
    valor_repasse: {
      type: "numeric(10,2)",
      notNull: false,
      comment:
        "Valor de repasse personalizado para a sessão. Se NULL, o cálculo automático será usado.",
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  // Remover a coluna em caso de rollback
  pgm.dropColumn("sessoes", "valor_repasse");
};
