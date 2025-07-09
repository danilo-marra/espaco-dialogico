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
  // Primeiro, atualizar todos os agendamentos com status "Remarcado" para "Confirmado"
  pgm.sql(`
    UPDATE agendamentos 
    SET status_agendamento = 'Confirmado' 
    WHERE status_agendamento = 'Remarcado';
  `);

  // Remover o constraint antigo que permite "Remarcado"
  pgm.dropConstraint("agendamentos", "agendamentos_status_agendamento_check");

  // Adicionar novo constraint sem "Remarcado"
  pgm.addConstraint("agendamentos", "agendamentos_status_agendamento_check", {
    check: `status_agendamento IN ('Confirmado', 'Cancelado')`,
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (_pgm) => {
  // ATENÇÃO: Esta migration é irreversível pois converte dados
  // Se necessário fazer rollback, será preciso restaurar backup do banco
  throw new Error(
    "Esta migration é irreversível pois remove dados. Restaure um backup para fazer rollback.",
  );
};
