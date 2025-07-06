exports.up = (pgm) => {
  // Adicionar campo para armazenar URL do arquivo PDF do currículo
  pgm.addColumn("terapeutas", {
    curriculo_arquivo: {
      type: "varchar(500)",
      comment: "URL do arquivo PDF do currículo do terapeuta",
    },
  });
};

exports.down = (pgm) => {
  // Reverter: remover o campo curriculo_arquivo
  pgm.dropColumn("terapeutas", "curriculo_arquivo");
};
