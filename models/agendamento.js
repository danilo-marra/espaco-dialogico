import database from "infra/database.js";
import { ValidationError, NotFoundError } from "infra/errors.js";

async function create(agendamentoData) {
  // Verificar se o terapeuta existe
  const terapeutaExists = await database.query({
    text: `SELECT id FROM terapeutas WHERE id = $1`,
    values: [agendamentoData.terapeuta_id],
  });

  if (terapeutaExists.rowCount === 0) {
    throw new ValidationError({
      message: "Terapeuta não encontrado",
    });
  }

  // Verificar se o paciente existe
  const pacienteExists = await database.query({
    text: `SELECT id FROM pacientes WHERE id = $1`,
    values: [agendamentoData.paciente_id],
  });

  if (pacienteExists.rowCount === 0) {
    throw new ValidationError({
      message: "Paciente não encontrado",
    });
  }

  // Inserir o agendamento no banco de dados
  const result = await database.query({
    text: `
      INSERT INTO agendamentos (
        terapeuta_id,
        paciente_id,
        recurrence_id,
        data_agendamento,
        horario_agendamento,
        local_agendamento,
        modalidade_agendamento,
        tipo_agendamento,
        valor_agendamento,
        status_agendamento,
        observacoes_agendamento
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `,
    values: [
      agendamentoData.terapeuta_id,
      agendamentoData.paciente_id,
      agendamentoData.recurrenceId,
      agendamentoData.dataAgendamento,
      agendamentoData.horarioAgendamento,
      agendamentoData.localAgendamento,
      agendamentoData.modalidadeAgendamento,
      agendamentoData.tipoAgendamento,
      agendamentoData.valorAgendamento,
      agendamentoData.statusAgendamento || "Confirmado",
      agendamentoData.observacoesAgendamento,
    ],
  });

  // Retornar agendamento com informações completas
  return await getById(result.rows[0].id);
}

async function getAll() {
  const result = await database.query({
    text: `
      SELECT 
        a.*,
        t.nome as terapeuta_nome,
        t.foto as terapeuta_foto,
        t.telefone as terapeuta_telefone,
        t.email as terapeuta_email,
        t.endereco as terapeuta_endereco,
        t.dt_entrada as terapeuta_dt_entrada,
        t.chave_pix as terapeuta_chave_pix,
        p.nome as paciente_nome,
        p.dt_nascimento as paciente_dt_nascimento,
        p.nome_responsavel as paciente_nome_responsavel,
        p.telefone_responsavel as paciente_telefone_responsavel,
        p.email_responsavel as paciente_email_responsavel,
        p.cpf_responsavel as paciente_cpf_responsavel,
        p.endereco_responsavel as paciente_endereco_responsavel,
        p.origem as paciente_origem,
        p.dt_entrada as paciente_dt_entrada
      FROM 
        agendamentos a
      JOIN 
        terapeutas t ON a.terapeuta_id = t.id
      JOIN 
        pacientes p ON a.paciente_id = p.id
      ORDER BY 
        a.data_agendamento DESC, a.horario_agendamento ASC
    `,
  });

  return result.rows.map(formatAgendamentoResult);
}

async function getFiltered(filters) {
  const conditions = [];
  const values = [];
  let paramCounter = 1;

  if (filters.terapeuta_id) {
    conditions.push(`a.terapeuta_id = $${paramCounter}`);
    values.push(filters.terapeuta_id);
    paramCounter++;
  }

  if (filters.paciente_id) {
    conditions.push(`a.paciente_id = $${paramCounter}`);
    values.push(filters.paciente_id);
    paramCounter++;
  }

  if (filters.status) {
    conditions.push(`a.status_agendamento = $${paramCounter}`);
    values.push(filters.status);
    paramCounter++;
  }

  if (filters.dataInicio && filters.dataFim) {
    conditions.push(
      `a.data_agendamento BETWEEN $${paramCounter} AND $${paramCounter + 1}`,
    );
    values.push(filters.dataInicio, filters.dataFim);
    paramCounter += 2;
  } else if (filters.dataInicio) {
    conditions.push(`a.data_agendamento >= $${paramCounter}`);
    values.push(filters.dataInicio);
    paramCounter++;
  } else if (filters.dataFim) {
    conditions.push(`a.data_agendamento <= $${paramCounter}`);
    values.push(filters.dataFim);
    paramCounter++;
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await database.query({
    text: `
      SELECT 
        a.*,
        t.nome as terapeuta_nome,
        t.foto as terapeuta_foto,
        t.telefone as terapeuta_telefone,
        t.email as terapeuta_email,
        t.endereco as terapeuta_endereco,
        t.dt_entrada as terapeuta_dt_entrada,
        t.chave_pix as terapeuta_chave_pix,
        p.nome as paciente_nome,
        p.dt_nascimento as paciente_dt_nascimento,
        p.nome_responsavel as paciente_nome_responsavel,
        p.telefone_responsavel as paciente_telefone_responsavel,
        p.email_responsavel as paciente_email_responsavel,
        p.cpf_responsavel as paciente_cpf_responsavel,
        p.endereco_responsavel as paciente_endereco_responsavel,
        p.origem as paciente_origem,
        p.dt_entrada as paciente_dt_entrada
      FROM 
        agendamentos a
      JOIN 
        terapeutas t ON a.terapeuta_id = t.id
      JOIN 
        pacientes p ON a.paciente_id = p.id
      ${whereClause}
      ORDER BY 
        a.data_agendamento DESC, a.horario_agendamento ASC
    `,
    values: values,
  });

  return result.rows.map(formatAgendamentoResult);
}

async function getById(id) {
  const result = await database.query({
    text: `
      SELECT 
        a.*,
        t.nome as terapeuta_nome,
        t.foto as terapeuta_foto,
        t.telefone as terapeuta_telefone,
        t.email as terapeuta_email,
        t.endereco as terapeuta_endereco,
        t.dt_entrada as terapeuta_dt_entrada,
        t.chave_pix as terapeuta_chave_pix,
        p.nome as paciente_nome,
        p.dt_nascimento as paciente_dt_nascimento,
        p.nome_responsavel as paciente_nome_responsavel,
        p.telefone_responsavel as paciente_telefone_responsavel,
        p.email_responsavel as paciente_email_responsavel,
        p.cpf_responsavel as paciente_cpf_responsavel,
        p.endereco_responsavel as paciente_endereco_responsavel,
        p.origem as paciente_origem,
        p.dt_entrada as paciente_dt_entrada
      FROM 
        agendamentos a
      JOIN 
        terapeutas t ON a.terapeuta_id = t.id
      JOIN 
        pacientes p ON a.paciente_id = p.id
      WHERE 
        a.id = $1
    `,
    values: [id],
  });

  if (result.rowCount === 0) {
    throw new NotFoundError({
      message: "Agendamento não encontrado",
    });
  }

  return formatAgendamentoResult(result.rows[0]);
}

async function update(id, agendamentoData) {
  // Verificar se o agendamento existe
  await getById(id);

  // Preparar os campos a serem atualizados
  const fieldsToUpdate = [];
  const values = [];
  let paramCounter = 1;

  // Função auxiliar para adicionar campos a serem atualizados
  function addField(fieldName, value) {
    if (value !== undefined) {
      fieldsToUpdate.push(`${fieldName} = $${paramCounter}`);
      values.push(value);
      paramCounter++;
    }
  }

  // Adicionar cada campo que precisa ser atualizado
  addField("data_agendamento", agendamentoData.dataAgendamento);
  addField("horario_agendamento", agendamentoData.horarioAgendamento);
  addField("local_agendamento", agendamentoData.localAgendamento);
  addField("modalidade_agendamento", agendamentoData.modalidadeAgendamento);
  addField("tipo_agendamento", agendamentoData.tipoAgendamento);
  addField("valor_agendamento", agendamentoData.valorAgendamento);
  addField("status_agendamento", agendamentoData.statusAgendamento);
  addField("observacoes_agendamento", agendamentoData.observacoesAgendamento);
  addField("recurrence_id", agendamentoData.recurrenceId);

  // Se não houver campos para atualizar, retornar os dados atuais
  if (fieldsToUpdate.length === 0) {
    return await getById(id);
  }

  // Adicionar o id para a cláusula WHERE
  values.push(id);

  // Construir a query SQL
  const sql = `
    UPDATE agendamentos
    SET ${fieldsToUpdate.join(", ")}, updated_at = NOW()
    WHERE id = $${paramCounter}
    RETURNING *
  `;

  // Executar a query
  await database.query({
    text: sql,
    values: values,
  });

  // Retornar os dados atualizados
  return await getById(id);
}

async function remove(id) {
  // Verificar se o agendamento existe
  await getById(id);

  // Excluir o agendamento
  await database.query({
    text: "DELETE FROM agendamentos WHERE id = $1",
    values: [id],
  });

  return true;
}

function formatAgendamentoResult(row) {
  return {
    id: row.id,
    paciente_id: row.paciente_id,
    terapeuta_id: row.terapeuta_id,
    recurrenceId: row.recurrence_id,
    dataAgendamento: row.data_agendamento,
    horarioAgendamento: row.horario_agendamento,
    localAgendamento: row.local_agendamento,
    modalidadeAgendamento: row.modalidade_agendamento,
    tipoAgendamento: row.tipo_agendamento,
    valorAgendamento: parseFloat(row.valor_agendamento),
    statusAgendamento: row.status_agendamento,
    observacoesAgendamento: row.observacoes_agendamento,
    created_at: row.created_at,
    updated_at: row.updated_at,

    // Informações do terapeuta
    terapeutaInfo: {
      id: row.terapeuta_id,
      nome: row.terapeuta_nome,
      foto: row.terapeuta_foto,
      telefone: row.terapeuta_telefone,
      email: row.terapeuta_email,
      endereco: row.terapeuta_endereco,
      dt_entrada: row.terapeuta_dt_entrada,
      chave_pix: row.terapeuta_chave_pix,
    },

    // Informações do paciente
    pacienteInfo: {
      id: row.paciente_id,
      nome: row.paciente_nome,
      dt_nascimento: row.paciente_dt_nascimento,
      nome_responsavel: row.paciente_nome_responsavel,
      telefone_responsavel: row.paciente_telefone_responsavel,
      email_responsavel: row.paciente_email_responsavel,
      cpf_responsavel: row.paciente_cpf_responsavel,
      endereco_responsavel: row.paciente_endereco_responsavel,
      origem: row.paciente_origem,
      dt_entrada: row.paciente_dt_entrada,
    },
  };
}

const agendamento = {
  create,
  getAll,
  getById,
  getFiltered,
  update,
  remove,
};

export default agendamento;
