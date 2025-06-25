exports.up = (pgm) => {
  // Adicionar a coluna user_id à tabela terapeutas
  pgm.addColumn("terapeutas", {
    user_id: {
      type: "uuid",
      references: "users(id)",
      onDelete: "SET NULL",
      comment: "ID do usuário associado ao terapeuta para acesso ao sistema",
    },
  });

  // Criar índice para melhorar performance das consultas
  pgm.createIndex("terapeutas", "user_id");
};

exports.down = (pgm) => {
  // Remover o índice
  pgm.dropIndex("terapeutas", "user_id");

  // Remover a coluna user_id
  pgm.dropColumn("terapeutas", "user_id");
};
