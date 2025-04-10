const bcryptjs = require("bcryptjs");

exports.up = async (pgm) => {
  // Gerar hash da senha do administrador
  const saltRounds = 10;
  const adminPassword = "adminSecurePassword123"; // Defina uma senha segura
  const hashedPassword = await bcryptjs.hash(adminPassword, saltRounds);

  // Inserir usuário administrador
  pgm.sql(`
    INSERT INTO users (username, email, password, role)
    VALUES ('admin', 'admin@espacodialogico.com.br', '${hashedPassword}', 'admin')
    ON CONFLICT (username) DO NOTHING;
  `);

  console.log("Usuário administrador criado:");
  console.log("- Username: admin");
  console.log("- Email: admin@espacodialogico.com.br");
  console.log("- Senha: adminSecurePassword123");
  console.log("- Role: admin");
};

exports.down = false;
