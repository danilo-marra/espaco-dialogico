exports.up = (pgm) => {
  // Primeiro verifica se a coluna já existe na tabela
  pgm.sql(`
    DO $$ 
    BEGIN
      IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='users' AND column_name='role'
      ) THEN
        ALTER TABLE users ADD COLUMN role varchar(20) NOT NULL DEFAULT 'user';
        CREATE INDEX idx_users_role ON users(role);
      END IF;
    END $$;
  `);

  console.log("Verificação da coluna 'role' na tabela 'users' concluída");
};

exports.down = false;
