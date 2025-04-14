exports.up = (pgm) => {
  pgm.createTable("sessoes", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },

    // Relacionamentos
    terapeuta_id: {
      type: "uuid",
      notNull: true,
      references: '"terapeutas"',
      onDelete: "CASCADE",
    },
    paciente_id: {
      type: "uuid",
      notNull: true,
      references: '"pacientes"',
      onDelete: "CASCADE",
    },

    // Detalhes da sessão
    tipo_sessao: {
      type: "varchar(50)",
      notNull: true,
      check: `tipo_sessao IN ('Anamnese', 'Atendimento', 'Avaliação', 'Visitar Escolar')`,
    },
    valor_sessao: {
      type: "numeric(10,2)",
      notNull: true,
    },
    status_sessao: {
      type: "varchar(50)",
      default: "Pagamento Pendente",
      check: `status_sessao IN ('Pagamento Pendente', 'Pagamento Realizado', 'Nota Fiscal Emitida', 'Nota Fiscal Enviada')`,
    },

    // Datas das sessões
    dt_sessao1: {
      type: "timestamptz",
      notNull: false,
    },
    dt_sessao2: {
      type: "timestamptz",
      notNull: false,
    },
    dt_sessao3: {
      type: "timestamptz",
      notNull: false,
    },
    dt_sessao4: {
      type: "timestamptz",
      notNull: false,
    },
    dt_sessao5: {
      type: "timestamptz",
      notNull: false,
    },
    dt_sessao6: {
      type: "timestamptz",
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
  pgm.createIndex("sessoes", "terapeuta_id");
  pgm.createIndex("sessoes", "paciente_id");
  pgm.createIndex("sessoes", "status_sessao");
};

exports.down = (pgm) => {
  pgm.dropTable("sessoes");
};
