/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = async function (pgm) {
  pgm.sql(`
    INSERT INTO pacientes (
      id,
      nome_paciente,
      dt_nascimento,
      nome_responsavel,
      telefone_responsavel,
      email_responsavel,
      cpf_responsavel,
      endereco_responsavel,
      origem,
      dt_entrada_paciente,
      terapeuta_id
    ) VALUES
      (
        uuid_generate_v4(),
        'João da Silva',
        '1990-05-15',
        'Maria da Silva',
        '(11) 91234-5678',
        'maria.silva@example.com',
        '123.456.789-00',
        'Rua Exemplo, 123',
        'Indicação',
        '2024-04-01',
        (SELECT id FROM terapeutas LIMIT 1)
      ),
      (
        uuid_generate_v4(),
        'Ana Souza',
        '1985-03-22',
        'Carlos Souza',
        '(11) 99876-5432',
        'carlos.souza@example.com',
        '987.654.321-00',
        'Av. Exemplo, 456',
        'Busca no Google',
        '2024-04-02',
        (SELECT id FROM terapeutas LIMIT 1)
      );
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = async function (pgm) {
  pgm.sql(`TRUNCATE TABLE pacientes RESTART IDENTITY;`);
};
