exports.up = (pgm) => {
  pgm.createTable("user_sessions", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },

    // Token da sessão
    token: {
      type: "varchar(255)",
      notNull: true,
      unique: true,
    },

    // Relacionamento com usuário
    user_id: {
      type: "uuid",
      notNull: true,
      references: '"users"',
      onDelete: "CASCADE",
    },

    // Data de expiração
    expires_at: {
      type: "timestamptz",
      notNull: true,
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
  pgm.createIndex("user_sessions", "token");
  pgm.createIndex("user_sessions", "user_id");
  pgm.createIndex("user_sessions", "expires_at");
};

exports.down = (pgm) => {
  pgm.dropTable("user_sessions");
};
