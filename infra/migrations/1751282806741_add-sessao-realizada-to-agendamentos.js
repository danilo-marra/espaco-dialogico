exports.up = (pgm) => {
  pgm.addColumn("agendamentos", {
    sessao_realizada: {
      type: "boolean",
      notNull: true,
      default: false,
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn("agendamentos", "sessao_realizada");
};
