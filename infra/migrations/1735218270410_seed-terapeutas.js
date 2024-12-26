/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = async function (pgm) {
  pgm.sql(`
    INSERT INTO terapeutas (
      "nomeTerapeuta",
      "foto",
      "telefoneTerapeuta",
      "emailTerapeuta",
      "enderecoTerapeuta",
      "dtEntrada",
      "chavePix"
    ) VALUES 
    (
      'Maria Silva',
      'https://github.com/maria-silva.png',
      '(31) 99999-9999',
      'maria.silva@espacodialogico.com.br',
      'Rua das Flores, 123 - Belo Horizonte/MG',
      '2024-01-01',
      'maria.silva@banco.com.br'
    ),
    (
      'João Santos',
      'https://github.com/joao-santos.png',
      '(31) 98888-8888',
      'joao.santos@espacodialogico.com.br',
      'Av. Amazonas, 456 - Belo Horizonte/MG',
      '2024-02-01',
      'joao.santos@banco.com.br'
    ),
    (
      'Ana Oliveira',
      'https://github.com/ana-oliveira.png',
      '(31) 97777-7777',
      'ana.oliveira@espacodialogico.com.br',
      'Rua da Bahia, 789 - Belo Horizonte/MG',
      '2024-03-01',
      'ana.oliveira@banco.com.br'
    );
  `);
};

exports.down = async function (pgm) {
  pgm.sql(`
    TRUNCATE TABLE terapeutas RESTART IDENTITY;
  `);
};
