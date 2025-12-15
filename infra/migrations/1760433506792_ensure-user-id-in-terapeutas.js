/**
 * Migração para garantir que a coluna user_id existe na tabela terapeutas
 * Esta é uma migração idempotente que verifica se a coluna já existe antes de criá-la
 * Criada após outras migrações para manter compatibilidade com banco de produção
 */

exports.up = (pgm) => {
  // Verificar se a coluna já existe (ela deve existir se esta migração já rodou antes)
  pgm.sql(`
    DO $$ 
    BEGIN 
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'terapeutas' AND column_name = 'user_id'
      ) THEN
        ALTER TABLE terapeutas ADD COLUMN user_id uuid REFERENCES users(id) ON DELETE SET NULL;
        COMMENT ON COLUMN terapeutas.user_id IS 'ID do usuário associado ao terapeuta para acesso ao sistema';
      END IF;
    END $$;
  `);

  // Criar índice se não existir
  pgm.sql(`
    DO $$ 
    BEGIN 
      IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'terapeutas' AND indexname = 'terapeutas_user_id_index'
      ) THEN
        CREATE INDEX terapeutas_user_id_index ON terapeutas(user_id);
      END IF;
    END $$;
  `);
};

exports.down = (pgm) => {
  // Remover o índice se existir
  pgm.sql(`
    DROP INDEX IF EXISTS terapeutas_user_id_index;
  `);

  // Remover a coluna se existir
  pgm.sql(`
    ALTER TABLE terapeutas DROP COLUMN IF EXISTS user_id;
  `);
};
