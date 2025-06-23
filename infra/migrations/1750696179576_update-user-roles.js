exports.up = (pgm) => {
  // Atualizar os valores de role existentes de 'user' para 'terapeuta'
  pgm.sql(`
    UPDATE users 
    SET role = 'terapeuta' 
    WHERE role = 'user';
  `);

  // Adicionar constraint para validar os novos roles permitidos
  pgm.sql(`
    DO $$ 
    BEGIN
      -- Remover constraint antiga se existir
      IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'users_role_check' 
        AND table_name = 'users'
      ) THEN
        ALTER TABLE users DROP CONSTRAINT users_role_check;
      END IF;
      
      -- Adicionar nova constraint com os roles atualizados
      ALTER TABLE users ADD CONSTRAINT users_role_check 
      CHECK (role IN ('admin', 'terapeuta', 'secretaria'));
    END $$;
  `);

  console.log(
    "Migração de roles concluída: 'user' → 'terapeuta', adicionado 'secretaria'",
  );
};

exports.down = false;
