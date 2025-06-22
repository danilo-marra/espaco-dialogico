exports.up = (pgm) => {
  pgm.createTable("transacoes", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },

    // Tipo da transação
    tipo: {
      type: "varchar(10)",
      notNull: true,
      check: `tipo IN ('entrada', 'saida')`,
    },

    // Categoria da transação
    categoria: {
      type: "varchar(100)",
      notNull: true,
    },

    // Descrição detalhada
    descricao: {
      type: "text",
      notNull: true,
    },

    // Valor da transação
    valor: {
      type: "numeric(10,2)",
      notNull: true,
      check: "valor > 0",
    },

    // Data da transação
    data: {
      type: "date",
      notNull: true,
    },

    // Usuário que registrou a transação
    usuario_id: {
      type: "uuid",
      notNull: true,
      references: '"users"',
      onDelete: "CASCADE",
    },

    // Observações opcionais
    observacoes: {
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
  pgm.createIndex("transacoes", "tipo");
  pgm.createIndex("transacoes", "categoria");
  pgm.createIndex("transacoes", "data");
  pgm.createIndex("transacoes", "usuario_id");
  pgm.createIndex("transacoes", ["data", "tipo"]); // Índice composto para consultas por período e tipo
};

exports.down = (pgm) => {
  pgm.dropTable("transacoes");
};
