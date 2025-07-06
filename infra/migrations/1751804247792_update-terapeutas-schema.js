exports.up = (pgm) => {
  // Adicionar novos campos
  pgm.addColumn("terapeutas", {
    crp: {
      type: "varchar(20)",
      comment: "Número do Conselho Regional de Psicologia",
    },
    dt_nascimento: {
      type: "date",
      comment: "Data de nascimento do terapeuta",
    },
    curriculo: {
      type: "text",
      comment: "Currículo/experiência profissional do terapeuta",
    },
  });

  // Remover o campo endereco
  pgm.dropColumn("terapeutas", "endereco");
};

exports.down = (pgm) => {
  // Reverter: adicionar de volta o campo endereco
  pgm.addColumn("terapeutas", {
    endereco: { type: "varchar(255)", notNull: true, default: "" },
  });

  // Reverter: remover os novos campos
  pgm.dropColumn("terapeutas", ["crp", "dt_nascimento", "curriculo"]);
};
