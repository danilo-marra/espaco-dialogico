// AVISO: Este arquivo contém credenciais obsoletas e não deve ser usado.
// As novas credenciais são definidas através de variáveis de ambiente
// e aplicadas pela migração 1744376265470_update-admin-from-env.js
const bcryptjs = require("bcryptjs");

exports.up = async (pgm) => {
  // Essa migração não será mais executada automaticamente em produção
  // Todas as credenciais serão gerenciadas pela migração update-admin-from-env
  console.log(
    "AVISO: Usando migração obsoleta. Considere usar a migração update-admin-from-env.",
  );

  // Código mantido por compatibilidade histórica
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
