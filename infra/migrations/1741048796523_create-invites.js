exports.up = (pgm) => {
  pgm.createTable("invites", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },

    // Código de convite único
    code: {
      type: "varchar(20)",
      notNull: true,
      unique: true,
    },

    // Email destinatário (opcional)
    email: {
      type: "varchar(254)",
      notNull: false,
    },

    // Papel/função do usuário convidado
    role: {
      type: "varchar(20)",
      notNull: true,
      default: "user",
    },

    // Data de criação
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },

    // Data de expiração
    expires_at: {
      type: "timestamptz",
      notNull: true,
    },

    // Status do convite
    used: {
      type: "boolean",
      notNull: true,
      default: false,
    },

    // Quem criou o convite (referência à tabela users)
    created_by: {
      type: "uuid",
      references: "users(id)",
      onDelete: "SET NULL",
    },

    // Quem usou o convite (referência à tabela users)
    used_by: {
      type: "uuid",
      references: "users(id)",
      onDelete: "SET NULL",
    },
  });

  // Adicionar uma coluna 'role' na tabela users existente
  pgm.addColumn("users", {
    role: {
      type: "varchar(20)",
      notNull: true,
      default: "user",
    },
  });
};

exports.down = false;
