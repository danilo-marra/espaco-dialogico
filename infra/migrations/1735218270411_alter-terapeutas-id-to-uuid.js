/* eslint-disable no-unused-vars */
/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = async function (pgm) {
  // Cria a extensão uuid-ossp se ainda não existir
  pgm.createExtension("uuid-ossp", { ifNotExists: true });

  // Adiciona uma nova coluna 'id_new' do tipo UUID com valor padrão gerado
  pgm.addColumn("terapeutas", {
    id_new: {
      type: "uuid",
      notNull: true,
      default: pgm.func("uuid_generate_v4()"),
    },
  });

  // Copia os IDs existentes para a nova coluna (gerando novos UUIDs)
  pgm.sql("UPDATE terapeutas SET id_new = uuid_generate_v4()");

  // Remove a restrição de chave primária existente
  pgm.dropConstraint("terapeutas", "terapeutas_pkey");

  // Define a nova coluna 'id_new' como chave primária
  pgm.addConstraint("terapeutas", "terapeutas_pkey_new", {
    primaryKey: ["id_new"],
  });

  // Remove a coluna antiga 'id'
  pgm.dropColumn("terapeutas", "id");

  // Renomeia 'id_new' para 'id'
  pgm.renameColumn("terapeutas", "id_new", "id");
};

exports.down = async function (pgm) {
  // Renomeia 'id' de volta para 'id_new'
  pgm.renameColumn("terapeutas", "id", "id_new");

  // Adiciona a coluna 'id' como serial novamente
  pgm.addColumn("terapeutas", {
    id: {
      type: "serial",
      primaryKey: true,
    },
  });

  // Remove a nova chave primária
  pgm.dropConstraint("terapeutas", "terapeutas_pkey_new");

  // Define a coluna 'id' antiga como chave primária
  pgm.addConstraint("terapeutas", "terapeutas_pkey", {
    primaryKey: ["id"],
  });

  // Remove a coluna 'id_new'
  pgm.dropColumn("terapeutas", "id_new");

  // Remove a extensão uuid-ossp
  pgm.dropExtension("uuid-ossp");
};
