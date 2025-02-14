/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = function (pgm) {
  // Se necessário, ative a extensão do uuid
  // pgm.createExtension("uuid-ossp", { ifNotExists: true });

  pgm.createTable("pacientes", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("uuid_generate_v4()"),
    },
    nome_paciente: { type: "varchar(255)", notNull: true },
    dt_nascimento: { type: "date", notNull: true },
    nome_responsavel: { type: "varchar(255)", notNull: true },
    telefone_responsavel: { type: "varchar(20)", notNull: true },
    email_responsavel: { type: "varchar(255)", notNull: true },
    cpf_responsavel: { type: "varchar(14)", notNull: true },
    endereco_responsavel: { type: "text", notNull: true },
    origem: { type: "varchar(50)" },
    dt_entrada_paciente: { type: "date", notNull: true },
    terapeuta_id: {
      type: "uuid",
      references: "terapeutas(id)",
      onDelete: "SET NULL",
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = function (pgm) {
  pgm.dropTable("pacientes");
};
