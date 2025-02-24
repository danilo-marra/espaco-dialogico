exports.up = (pgm) => {
  pgm.createTable("terapeutas", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    nome: { type: "varchar(255)", notNull: true },
    foto: { type: "varchar(500)" },
    telefone: { type: "varchar(20)", notNull: true },
    email: { type: "varchar(255)", notNull: true, unique: true },
    endereco: { type: "varchar(255)", notNull: true },
    dtEntrada: {
      type: "date",
      notNull: true,
    },
    chavePix: { type: "varchar(255)", notNull: true },
    created_at: {
      type: "timestamptz",
      default: pgm.func("now()"),
    },

    updated_at: {
      type: "timestamptz",
      default: pgm.func("now()"),
    },
  });
};

exports.down = false;
