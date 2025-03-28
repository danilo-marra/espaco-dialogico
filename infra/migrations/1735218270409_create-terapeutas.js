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
    dt_entrada: {
      type: "date",
      notNull: true,
    },
    chave_pix: { type: "varchar(255)", notNull: true },
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
};

exports.down = false;
