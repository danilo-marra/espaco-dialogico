exports.up = (pgm) => {
  pgm.createTable("pacientes", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    nome: { type: "varchar(255)", notNull: true },
    dt_nascimento: { type: "date", notNull: true },
    terapeuta_id: {
      type: "uuid",
      notNull: true,
      references: '"terapeutas"',
      onDelete: "CASCADE",
    },
    nome_responsavel: { type: "varchar(255)", notNull: true },
    telefone_responsavel: { type: "varchar(20)", notNull: true },
    email_responsavel: { type: "varchar(255)", notNull: true },
    cpf_responsavel: { type: "varchar(14)", notNull: true },
    endereco_responsavel: { type: "varchar(255)", notNull: true },
    origem: {
      type: "varchar(50)",
      notNull: true,
      check: `origem IN ('Indicação', 'Instagram', 'Busca no Google', 'Outros')`,
    },
    dt_entrada: {
      type: "timestamptz",
      notNull: true,
    },
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

exports.down = (pgm) => {
  pgm.dropTable("pacientes");
};
