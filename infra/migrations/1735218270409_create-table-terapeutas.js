/* eslint-disable no-unused-vars */
/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = async function (pgm) {
  pgm.createTable("terapeutas", {
    id: { type: "serial", primaryKey: true },
    nomeTerapeuta: { type: "varchar(255)", notNull: true },
    foto: { type: "varchar(500)" },
    telefoneTerapeuta: { type: "varchar(20)", notNull: true },
    emailTerapeuta: { type: "varchar(255)", notNull: true },
    enderecoTerapeuta: { type: "text", notNull: true },
    dtEntrada: {
      type: "date",
      notNull: true,
      default: pgm.func("CURRENT_DATE"),
    },
    chavePix: { type: "varchar(255)", notNull: true },
  });
};

exports.down = async function (pgm) {
  pgm.dropTable("terapeutas");
};
