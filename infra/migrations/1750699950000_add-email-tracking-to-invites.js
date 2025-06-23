exports.up = async (pgm) => {
  // Adicionar coluna para rastrear quando o último email foi enviado para um convite
  pgm.addColumn("invites", {
    last_email_sent: {
      type: "timestamp with time zone",
      notNull: false,
    },
  });

  // Criar índice para consultas mais eficientes
  pgm.createIndex("invites", "last_email_sent");

  console.log("Migração: Adicionada coluna last_email_sent na tabela invites");
};

exports.down = async (pgm) => {
  // Remover índice
  pgm.dropIndex("invites", "last_email_sent");

  // Remover coluna
  pgm.dropColumn("invites", "last_email_sent");

  console.log(
    "Migração revertida: Removida coluna last_email_sent da tabela invites",
  );
};
