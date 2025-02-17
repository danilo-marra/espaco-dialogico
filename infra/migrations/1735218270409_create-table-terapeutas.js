/* eslint-disable no-unused-vars */
/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = async function (pgm) {
  // Ativa a extensão para gerar UUIDs, se ainda não estiver ativa
  pgm.createExtension("uuid-ossp", { ifNotExists: true });

  pgm.createTable("terapeutas", {
    idTerapeuta: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("uuid_generate_v4()"),
    },
    nomeTerapeuta: { type: "varchar(255)", notNull: true },
    fotoTerapeuta: { type: "varchar(500)" },
    telefoneTerapeuta: { type: "varchar(20)", notNull: true },
    emailTerapeuta: { type: "varchar(255)", notNull: true },
    enderecoTerapeuta: { type: "text", notNull: true },
    dtEntradaTerapeuta: {
      type: "date",
      notNull: true,
      default: pgm.func("CURRENT_DATE"),
    },
    chavePixTerapeuta: { type: "varchar(255)", notNull: true },
  });
};

exports.down = async function (pgm) {
  pgm.dropTable("terapeutas");
};
