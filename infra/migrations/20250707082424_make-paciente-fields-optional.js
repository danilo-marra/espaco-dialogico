exports.up = (pgm) => {
  // Tornar o campo dt_nascimento opcional
  pgm.alterColumn("pacientes", "dt_nascimento", {
    type: "date",
    notNull: false,
  });

  // Tornar o campo origem opcional
  pgm.alterColumn("pacientes", "origem", {
    type: "varchar(50)",
    notNull: false,
    check: `origem IN ('Indicação', 'Instagram', 'Busca no Google', 'Outros') OR origem IS NULL`,
  });
};

exports.down = (pgm) => {
  // Reverter as alterações - tornar os campos obrigatórios novamente
  // ATENÇÃO: Esta operação pode falhar se existirem registros com valores NULL
  pgm.alterColumn("pacientes", "dt_nascimento", {
    type: "date",
    notNull: true,
  });

  pgm.alterColumn("pacientes", "origem", {
    type: "varchar(50)",
    notNull: true,
    check: `origem IN ('Indicação', 'Instagram', 'Busca no Google', 'Outros')`,
  });
};
