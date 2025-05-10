exports.up = async (pgm) => {
  // Adicionar coluna agendamento_id à tabela sessoes
  pgm.addColumn("sessoes", {
    agendamento_id: {
      type: "uuid",
      references: "agendamentos(id)",
      onDelete: "SET NULL", // Se o agendamento for excluído, a sessão permanece
    },
  });

  // Criar índice para melhor performance
  pgm.createIndex("sessoes", "agendamento_id");
};

exports.down = async (pgm) => {
  // Remover índice
  pgm.dropIndex("sessoes", "agendamento_id");

  // Remover coluna
  pgm.dropColumn("sessoes", "agendamento_id");
};
