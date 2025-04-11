const bcryptjs = require("bcryptjs");

/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * Atualiza ou cria o usuário administrador utilizando variáveis de ambiente.
 * Com a nova implementação de login, os usuários autenticam-se usando email em vez de username.
 *
 * Variáveis de ambiente necessárias:
 * - ADMIN_USERNAME: Nome de usuário do administrador (ainda necessário para o banco de dados)
 * - ADMIN_EMAIL: Email do administrador (usado para login)
 * - ADMIN_PASSWORD: Senha do administrador
 *
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
    console.log(`Criando novo usuário admin: ${adminUsername} (${adminEmail})`);
    pgm.sql(`
      INSERT INTO users (username, email, password, role)
      VALUES ('${adminUsername}', '${adminEmail}', '${hashedPassword}', 'admin');
    `);

    console.log("Usuário administrador atualizado com sucesso:");
    console.log(`- Username: ${adminUsername}`);
    console.log(`- Email: ${adminEmail} (usado para login)`);
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
