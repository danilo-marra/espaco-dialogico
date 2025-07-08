/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = function (_pgm) {
  // NOTA: Esta migração corrige o timestamp da migração 1751900000000_remove-curriculo-from-terapeutas
  // A coluna "curriculo" já foi removida pela migração anterior com timestamp incorreto
  // Esta migração não faz nada, apenas garante que o timestamp correto esteja no histórico
  console.log(
    "Migração de correção de timestamp - coluna 'curriculo' já foi removida anteriormente",
  );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = function (pgm) {
  // Para rollback: recriar a coluna "curriculo"
  pgm.addColumn("terapeutas", {
    curriculo: {
      type: "text",
      notNull: false,
      comment:
        "Currículo do terapeuta em formato texto (REMOVIDO - usar curriculo_arquivo)",
    },
  });
};
