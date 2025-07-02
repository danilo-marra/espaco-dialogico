/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  // 1. Primeiro, adicionar os novos campos SEM constraints para permitir valores temporários
  pgm.addColumn("sessoes", {
    nota_fiscal: {
      type: "varchar(20)",
      notNull: false, // Temporariamente nullable
      default: null,
    },
    pagamento_realizado: {
      type: "boolean",
      notNull: false, // Temporariamente nullable
      default: null,
    },
  });

  // 2. Migrar dados existentes do status_sessao para os novos campos
  pgm.sql(`
    UPDATE sessoes SET 
      pagamento_realizado = CASE 
        WHEN status_sessao IN ('Pagamento Realizado', 'Nota Fiscal Emitida', 'Nota Fiscal Enviada') 
        THEN true 
        ELSE false 
      END,
      nota_fiscal = CASE 
        WHEN status_sessao = 'Nota Fiscal Emitida' THEN 'Emitida'
        WHEN status_sessao = 'Nota Fiscal Enviada' THEN 'Enviada'
        ELSE 'Não Emitida'
      END
    WHERE status_sessao IS NOT NULL
  `);

  // 3. Para registros sem status_sessao ou com valores NULL, definir valores padrão
  pgm.sql(`
    UPDATE sessoes SET 
      pagamento_realizado = false,
      nota_fiscal = 'Não Emitida'
    WHERE pagamento_realizado IS NULL OR nota_fiscal IS NULL
  `);

  // 4. Agora que todos os dados estão preenchidos, adicionar as constraints
  pgm.alterColumn("sessoes", "nota_fiscal", {
    notNull: true,
  });

  pgm.alterColumn("sessoes", "pagamento_realizado", {
    notNull: true,
  });

  // 5. Adicionar o check constraint
  pgm.addConstraint("sessoes", "sessoes_nota_fiscal_check", {
    check: "nota_fiscal IN ('Não Emitida', 'Emitida', 'Enviada')",
  });

  // 6. Remover coluna antiga
  pgm.dropColumn("sessoes", "status_sessao");

  // 7. Criar índices para melhor performance
  pgm.createIndex("sessoes", "pagamento_realizado");
  pgm.createIndex("sessoes", "nota_fiscal");
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  // 1. Recriar coluna status_sessao
  pgm.addColumn("sessoes", {
    status_sessao: {
      type: "varchar(50)",
      notNull: true,
      default: "'Pagamento Pendente'",
    },
  });

  // 2. Migrar dados de volta para o formato antigo
  pgm.sql(`
    UPDATE sessoes SET 
      status_sessao = CASE 
        WHEN nota_fiscal = 'Enviada' THEN 'Nota Fiscal Enviada'
        WHEN nota_fiscal = 'Emitida' THEN 'Nota Fiscal Emitida'
        WHEN pagamento_realizado = true THEN 'Pagamento Realizado'
        ELSE 'Pagamento Pendente'
      END
  `);

  // 3. Adicionar check constraint para status_sessao
  pgm.addConstraint("sessoes", "sessoes_status_sessao_check", {
    check:
      "status_sessao IN ('Pagamento Pendente', 'Pagamento Realizado', 'Nota Fiscal Emitida', 'Nota Fiscal Enviada')",
  });

  // 4. Remover índices
  pgm.dropIndex("sessoes", "nota_fiscal");
  pgm.dropIndex("sessoes", "pagamento_realizado");

  // 5. Remover constraint
  pgm.dropConstraint("sessoes", "sessoes_nota_fiscal_check");

  // 6. Remover novas colunas
  pgm.dropColumn("sessoes", "nota_fiscal");
  pgm.dropColumn("sessoes", "pagamento_realizado");
};
