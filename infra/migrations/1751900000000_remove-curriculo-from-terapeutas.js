exports.up = function (pgm) {
  // Remover a coluna "curriculo" da tabela "terapeutas"
  pgm.dropColumn("terapeutas", "curriculo");
};

exports.down = function (pgm) {
  // Para rollback: recriar a coluna "curriculo"
  pgm.addColumn("terapeutas", {
    curriculo: {
      type: "text",
      notNull: false,
      comment:
        "Currículo do terapeuta em formato texto (REMOVIDO - usar curriculo_arquivo)",
    },
  });
};
