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
  // Remove a constraint antiga
  pgm.dropConstraint("agendamentos", "agendamentos_local_agendamento_check");

  // Adiciona a nova constraint com a Sala 321
  pgm.addConstraint("agendamentos", "agendamentos_local_agendamento_check", {
    check: `local_agendamento IN ('Sala Verde', 'Sala Azul', 'Sala 321', 'Não Precisa de Sala')`,
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  // Remove a constraint nova
  pgm.dropConstraint("agendamentos", "agendamentos_local_agendamento_check");

  // Restaura a constraint antiga sem a Sala 321
  pgm.addConstraint("agendamentos", "agendamentos_local_agendamento_check", {
    check: `local_agendamento IN ('Sala Verde', 'Sala Azul', 'Não Precisa de Sala')`,
  });
};
