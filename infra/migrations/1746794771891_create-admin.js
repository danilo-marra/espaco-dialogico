const bcryptjs = require("bcryptjs");

exports.up = async (pgm) => {
  // Definições padrão
  const defaultAdmin = {
    username: "admin",
    email: "admin@espacodialogico.com.br",
    password: "AdminDefaultPassword", // Apenas como fallback
    role: "admin",
  };

  // Use variáveis de ambiente se disponíveis
  const adminUsername = process.env.ADMIN_USERNAME || defaultAdmin.username;
  const adminEmail = process.env.ADMIN_EMAIL || defaultAdmin.email;
  const adminPassword = process.env.ADMIN_PASSWORD || defaultAdmin.password;

  // Gerar hash da senha
  const saltRounds = 10;
  const hashedPassword = await bcryptjs.hash(adminPassword, saltRounds);

  // Atualizar admin existente ou criar novo
  pgm.sql(`
    INSERT INTO users (username, email, password, role)
    VALUES ('${adminUsername}', '${adminEmail}', '${hashedPassword}', 'admin')
    ON CONFLICT (email) 
    DO UPDATE SET 
      username = '${adminUsername}',
      password = '${hashedPassword}',
      role = 'admin'
    RETURNING id;
  `);

  console.log(
    `Admin user ${adminUsername} (${adminEmail}) created or updated successfully`,
  );
};

exports.down = false;
