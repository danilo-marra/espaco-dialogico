exports.up = (pgm) => {
  pgm.addColumns("pacientes", {
    nf_nome_completo: { type: "varchar(255)", notNull: true, default: "" },
    nf_telefone: { type: "varchar(20)", notNull: true, default: "" },
    nf_cpf: { type: "varchar(14)", notNull: true, default: "" },
    nf_email: { type: "varchar(255)", notNull: true, default: "" },
    nf_endereco: { type: "varchar(255)", notNull: true, default: "" },
    nf_dt_entrada: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
  });
  pgm.dropColumns("pacientes", [
    "email_responsavel",
    "cpf_responsavel",
    "endereco_responsavel",
  ]);
};

exports.down = (pgm) => {
  pgm.addColumns("pacientes", {
    email_responsavel: { type: "varchar(255)", notNull: true, default: "" },
    cpf_responsavel: { type: "varchar(14)", notNull: true, default: "" },
    endereco_responsavel: { type: "varchar(255)", notNull: true, default: "" },
  });
  pgm.dropColumns("pacientes", [
    "nf_nome_completo",
    "nf_telefone",
    "nf_cpf",
    "nf_email",
    "nf_endereco",
    "nf_dt_entrada",
  ]);
};
