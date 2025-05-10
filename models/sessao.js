import database from "infra/database.js";
import { ValidationError, NotFoundError } from "infra/errors.js";

async function create(sessaoData) {
  try {
    // Validar campos obrigatórios
    if (!sessaoData.terapeuta_id) {
      throw new ValidationError({
        message: "ID do terapeuta é obrigatório",
      });
    }

    if (!sessaoData.paciente_id) {
      throw new ValidationError({
        message: "ID do paciente é obrigatório",
      });
    }

    if (!sessaoData.tipoSessao) {
      throw new ValidationError({
        message: "Tipo de sessão é obrigatório",
      });
    }

    if (!sessaoData.valorSessao && sessaoData.valorSessao !== 0) {
      throw new ValidationError({
        message: "Valor da sessão é obrigatório",
      });
    }

    // Inserir a sessão no banco
    const result = await database.query({
      text: `
        INSERT INTO sessoes (
          terapeuta_id,
          paciente_id,
          tipo_sessao,
          valor_sessao,
          valor_repasse,
          status_sessao,
          dt_sessao1,
          dt_sessao2,
          dt_sessao3,
          dt_sessao4,
          dt_sessao5,
          dt_sessao6,
          agendamento_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `,
      values: [
        sessaoData.terapeuta_id,
        sessaoData.paciente_id,
        sessaoData.tipoSessao,
        sessaoData.valorSessao,
        sessaoData.valorRepasse,
        sessaoData.statusSessao || "Pagamento Pendente",
        sessaoData.dtSessao1,
        sessaoData.dtSessao2,
        sessaoData.dtSessao3,
        sessaoData.dtSessao4,
        sessaoData.dtSessao5,
        sessaoData.dtSessao6,
        sessaoData.agendamento_id,
      ],
    });

    // Retornar sessão com informações completas
    return await getById(result.rows[0].id);
  } catch (error) {
    console.error("Erro ao criar sessão:", error);
    throw error;
  }
}

async function getAll() {
  const result = await database.query({
    text: `
      SELECT 
        s.*,
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
        sessoes s
      JOIN 
        terapeutas t ON s.terapeuta_id = t.id
      JOIN 
        pacientes p ON s.paciente_id = p.id
      ORDER BY 
        COALESCE(s.dt_sessao1, s.created_at) DESC
    `,
  });

  return result.rows.map(formatSessaoResult);
}

async function getFiltered(filters) {
  const conditions = [];
  const values = [];
  let paramCounter = 1;

  if (filters.terapeuta_id) {
    conditions.push(`s.terapeuta_id = $${paramCounter}`);
    values.push(filters.terapeuta_id);
    paramCounter++;
  }

  if (filters.paciente_id) {
    conditions.push(`s.paciente_id = $${paramCounter}`);
    values.push(filters.paciente_id);
    paramCounter++;
  }

  if (filters.status) {
    conditions.push(`s.status_sessao = $${paramCounter}`);
    values.push(filters.status);
    paramCounter++;
  }

  // Adicionar filtro por agendamento_id
  if (filters.agendamento_id) {
    conditions.push(`s.agendamento_id = $${paramCounter}`);
    values.push(filters.agendamento_id);
    paramCounter++;
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await database.query({
    text: `
      SELECT 
        s.*,
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
        sessoes s
      JOIN 
        terapeutas t ON s.terapeuta_id = t.id
      JOIN 
        pacientes p ON s.paciente_id = p.id
      ${whereClause}
      ORDER BY 
        COALESCE(s.dt_sessao1, s.created_at) DESC
    `,
    values: values,
  });

  return result.rows.map(formatSessaoResult);
}

async function getById(id) {
  const result = await database.query({
    text: `
      SELECT 
        s.*,
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
        sessoes s
      JOIN 
        terapeutas t ON s.terapeuta_id = t.id
      JOIN 
        pacientes p ON s.paciente_id = p.id
      WHERE 
        s.id = $1
    `,
    values: [id],
  });

  if (result.rowCount === 0) {
    throw new NotFoundError({
      message: "Sessão não encontrada",
    });
  }

  return formatSessaoResult(result.rows[0]);
}

async function update(id, sessaoData) {
  // Verificar se a sessão existe
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
  addField("tipo_sessao", sessaoData.tipoSessao);
  addField("valor_sessao", sessaoData.valorSessao);
  addField("valor_repasse", sessaoData.valorRepasse);
  addField("status_sessao", sessaoData.statusSessao);
  addField("dt_sessao1", sessaoData.dtSessao1);
  addField("dt_sessao2", sessaoData.dtSessao2);
  addField("dt_sessao3", sessaoData.dtSessao3);
  addField("dt_sessao4", sessaoData.dtSessao4);
  addField("dt_sessao5", sessaoData.dtSessao5);
  addField("dt_sessao6", sessaoData.dtSessao6);
  addField("agendamento_id", sessaoData.agendamento_id);

  // Se não houver campos para atualizar, retornar a sessão existente
  if (fieldsToUpdate.length === 0) {
    return await getById(id);
  }

  // Adicionar o id como último parâmetro
  values.push(id);

  // Executar o update
  await database.query({
    text: `
      UPDATE sessoes
      SET ${fieldsToUpdate.join(", ")}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCounter}
    `,
    values: values,
  });

  // Retornar a sessão atualizada
  return await getById(id);
}

async function remove(id) {
  // Verificar se a sessão existe
  await getById(id);

  // Excluir a sessão
  await database.query({
    text: "DELETE FROM sessoes WHERE id = $1",
    values: [id],
  });

  return true;
}

function formatSessaoResult(row) {
  return {
    id: row.id,
    terapeuta_id: row.terapeuta_id,
    paciente_id: row.paciente_id,
    agendamento_id: row.agendamento_id,
    tipoSessao: row.tipo_sessao,
    valorSessao: parseFloat(row.valor_sessao),
    valorRepasse: row.valor_repasse ? parseFloat(row.valor_repasse) : undefined,
    statusSessao: row.status_sessao,
    dtSessao1: row.dt_sessao1,
    dtSessao2: row.dt_sessao2,
    dtSessao3: row.dt_sessao3,
    dtSessao4: row.dt_sessao4,
    dtSessao5: row.dt_sessao5,
    dtSessao6: row.dt_sessao6,
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
      dt_nascimento: row.dt_nascimento,
      nome_responsavel: row.nome_responsavel,
      telefone_responsavel: row.telefone_responsavel,
      email_responsavel: row.email_responsavel,
      cpf_responsavel: row.cpf_responsavel,
      endereco_responsavel: row.endereco_responsavel,
      origem: row.origem,
      dt_entrada: row.dt_entrada,
    },
  };
}

const sessao = {
  create,
  getAll,
  getById,
  getFiltered,
  update,
  remove,
};

export default sessao;
