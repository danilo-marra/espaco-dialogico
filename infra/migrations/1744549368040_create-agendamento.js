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
  pgm.createTable("agendamentos", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },

    // Relacionamentos
    paciente_id: {
      type: "uuid",
      notNull: true,
      references: '"pacientes"',
      onDelete: "CASCADE",
    },
    terapeuta_id: {
      type: "uuid",
      notNull: true,
      references: '"terapeutas"',
      onDelete: "CASCADE",
    },
    recurrence_id: {
      type: "uuid",
      notNull: false,
    },

    // Detalhes do agendamento
    data_agendamento: {
      type: "date",
      notNull: true,
    },
    horario_agendamento: {
      type: "varchar(10)",
      notNull: true,
    },
    local_agendamento: {
      type: "varchar(50)",
      notNull: true,
      check: `local_agendamento IN ('Sala Verde', 'Sala Azul', 'Não Precisa de Sala')`,
    },
    modalidade_agendamento: {
      type: "varchar(20)",
      notNull: true,
      check: `modalidade_agendamento IN ('Presencial', 'Online')`,
    },
    tipo_agendamento: {
      type: "varchar(50)",
      notNull: true,
      check: `tipo_agendamento IN ('Sessão', 'Orientação Parental', 'Visita Escolar', 'Supervisão', 'Outros')`,
    },
    valor_agendamento: {
      type: "numeric(10,2)",
      notNull: true,
    },
    status_agendamento: {
      type: "varchar(20)",
      notNull: true,
      default: "Confirmado",
      check: `status_agendamento IN ('Confirmado', 'Remarcado', 'Cancelado')`,
    },
    observacoes_agendamento: {
      type: "text",
      notNull: false,
    },

    // Controle de data/hora
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
  });

  // Índices para melhorar a performance
  pgm.createIndex("agendamentos", "terapeuta_id");
  pgm.createIndex("agendamentos", "paciente_id");
  pgm.createIndex("agendamentos", "data_agendamento");
  pgm.createIndex("agendamentos", "status_agendamento");
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("agendamentos");
};
