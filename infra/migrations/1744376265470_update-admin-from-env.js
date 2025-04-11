const bcryptjs = require("bcryptjs");

/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = async (pgm) => {
  // Verificar se temos variáveis de ambiente definidas
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  // Somente prosseguir se todas as variáveis estiverem definidas
  if (adminUsername && adminEmail && adminPassword) {
    const saltRounds = 10;
    const hashedPassword = await bcryptjs.hash(adminPassword, saltRounds);

    pgm.sql(`
      INSERT INTO users (username, email, password, role)
      VALUES ('${adminUsername}', '${adminEmail}', '${hashedPassword}', 'admin')
      ON CONFLICT (username) 
      DO UPDATE SET 
        email = EXCLUDED.email,
        password = EXCLUDED.password,
        role = EXCLUDED.role;
    `);

    console.log("Usuário administrador atualizado das variáveis de ambiente");
  } else {
    console.log(
      "Variáveis de ambiente para admin não encontradas, pulando atualização",
    );
  }
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = false;
