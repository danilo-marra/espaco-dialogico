exports.up = (pgm) => {
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_agendamentos_recurrence_id
      ON agendamentos(recurrence_id)
      WHERE recurrence_id IS NOT NULL;
  `);

  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_agendamentos_terapeuta_data
      ON agendamentos(terapeuta_id, data_agendamento);
  `);

  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_agendamentos_paciente_data
      ON agendamentos(paciente_id, data_agendamento);
  `);

  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_agendamentos_data_horario
      ON agendamentos(data_agendamento, horario_agendamento);
  `);

  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_pacientes_terapeuta_id
      ON pacientes(terapeuta_id);
  `);
};

exports.down = false;
