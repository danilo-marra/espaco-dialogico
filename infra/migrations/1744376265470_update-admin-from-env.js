const bcryptjs = require("bcryptjs");

/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
exports.up = async (pgm) => {
  // Verificar se temos variáveis de ambiente definidas
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  console.log("Executando migração de atualização do administrador");
  console.log(
    `Variáveis de admin definidas: ${Boolean(adminUsername && adminEmail && adminPassword)}`,
  );

  // Somente prosseguir se todas as variáveis estiverem definidas
  if (adminUsername && adminEmail && adminPassword) {
    // Gerar hash da senha do administrador
    const saltRounds = 10;
    const hashedPassword = await bcryptjs.hash(adminPassword, saltRounds);

    // Primeiro exclui o usuário admin antigo se existir
    console.log("Removendo usuários admin antigos...");
    pgm.sql(
      `DELETE FROM users WHERE username = 'admin' OR email = '${adminEmail}';`,
    );

    // Então insere o novo usuário admin
    console.log(`Criando novo usuário admin: ${adminUsername}`);
    pgm.sql(`
      INSERT INTO users (username, email, password, role)
      VALUES ('${adminUsername}', '${adminEmail}', '${hashedPassword}', 'admin');
    `);

    console.log("Usuário administrador atualizado com sucesso:");
    console.log(`- Username: ${adminUsername}`);
    console.log(`- Email: ${adminEmail}`);
    console.log("- Role: admin");
  } else {
    console.log(
      "Variáveis de ambiente para admin não encontradas, pulando atualização",
    );
    console.log(
      "Para configurar o usuário admin, defina ADMIN_USERNAME, ADMIN_EMAIL e ADMIN_PASSWORD",
    );
  }
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
exports.down = false;
