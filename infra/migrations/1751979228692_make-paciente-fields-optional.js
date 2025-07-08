/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (_pgm) => {
  // NOTA: Esta migração corrige o timestamp da migração 20250707082424_make-paciente-fields-optional
  // Os campos dt_nascimento e origem já foram tornados opcionais pela migração anterior com timestamp incorreto
  // Esta migração não faz nada, apenas garante que o timestamp correto esteja no histórico
  console.log(
    "Migração de correção de timestamp - campos dt_nascimento e origem já foram tornados opcionais anteriormente",
  );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  // Reverter as alterações - tornar os campos obrigatórios novamente
  // ATENÇÃO: Esta operação pode falhar se existirem registros com valores NULL
  pgm.alterColumn("pacientes", "dt_nascimento", {
    type: "date",
    notNull: true,
  });

  pgm.alterColumn("pacientes", "origem", {
    type: "varchar(50)",
    notNull: true,
    check: `origem IN ('Indicação', 'Instagram', 'Busca no Google', 'Outros')`,
  });
};
