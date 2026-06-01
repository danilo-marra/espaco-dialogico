import database from "infra/database.js";
import { NotFoundError } from "infra/errors";

async function create(pacienteInputValues) {
  const newPaciente = await runInsertQuery(pacienteInputValues);
  return newPaciente;

  async function runInsertQuery(pacienteInputValues) {
    const results = await database.query({
      text: `
    INSERT INTO
      pacientes (
        nome, 
        dt_nascimento, 
        terapeuta_id, 
        nome_responsavel, 
        telefone_responsavel, 
        origem, 
        dt_entrada,
        nf_nome_completo,
        nf_telefone,
        nf_cpf,
        nf_email,
        nf_endereco,
        nf_dt_entrada
      )
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING
      *
    ;`,
      values: [
        pacienteInputValues.nome,
        pacienteInputValues.dt_nascimento,
        pacienteInputValues.terapeuta_id,
        pacienteInputValues.nome_responsavel,
        pacienteInputValues.telefone_responsavel,
        pacienteInputValues.origem,
        pacienteInputValues.dt_entrada,
        pacienteInputValues.nf_nome_completo,
        pacienteInputValues.nf_telefone,
        pacienteInputValues.nf_cpf,
        pacienteInputValues.nf_email,
        pacienteInputValues.nf_endereco,
        pacienteInputValues.nf_dt_entrada,
      ],
    });

    return results.rows[0];
  }
}

async function getAll() {
  const query = {
    text: `
      SELECT 
        p.*,
        t.id as terapeuta_id,
        t.nome as terapeuta_nome,
        t.telefone as terapeuta_telefone,
        t.email as terapeuta_email,
        t.crp as terapeuta_crp,
        t.dt_nascimento as terapeuta_dt_nascimento,
        t.dt_entrada as terapeuta_dt_entrada,
        t.chave_pix as terapeuta_chave_pix,
        t.foto as terapeuta_foto
      FROM pacientes p
      LEFT JOIN terapeutas t ON p.terapeuta_id = t.id
      ORDER BY p.nome
    `,
  };

  const result = await database.query(query);

  // Transformar os resultados para incluir o objeto terapeutaInfo
  return result.rows.map(formatPacienteResult);
}

async function getFiltered(filters = {}) {
  const conditions = [];
  const values = [];
  let paramCounter = 1;

  if (filters.terapeuta_id) {
    conditions.push(`p.terapeuta_id = $${paramCounter}`);
    values.push(filters.terapeuta_id);
    paramCounter++;
  }

  if (filters.search) {
    conditions.push(`(
      p.nome ILIKE $${paramCounter}
      OR p.nome_responsavel ILIKE $${paramCounter}
      OR p.telefone_responsavel ILIKE $${paramCounter}
      OR p.nf_nome_completo ILIKE $${paramCounter}
      OR p.nf_email ILIKE $${paramCounter}
    )`);
    values.push(`%${filters.search}%`);
    paramCounter++;
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await database.query({
    text: `
      SELECT 
        p.*,
        t.id as terapeuta_id,
        t.nome as terapeuta_nome,
        t.telefone as terapeuta_telefone,
        t.email as terapeuta_email,
        t.crp as terapeuta_crp,
        t.dt_nascimento as terapeuta_dt_nascimento,
        t.dt_entrada as terapeuta_dt_entrada,
        t.chave_pix as terapeuta_chave_pix,
        t.foto as terapeuta_foto
      FROM pacientes p
      LEFT JOIN terapeutas t ON p.terapeuta_id = t.id
      ${whereClause}
      ORDER BY p.nome
      ${filters.limit !== undefined ? `LIMIT $${paramCounter}` : ""}
      ${
        filters.offset !== undefined
          ? `OFFSET $${filters.limit !== undefined ? paramCounter + 1 : paramCounter}`
          : ""
      }
    `,
    values:
      filters.limit !== undefined || filters.offset !== undefined
        ? [
            ...values,
            ...(filters.limit !== undefined ? [filters.limit] : []),
            ...(filters.offset !== undefined ? [filters.offset] : []),
          ]
        : values,
  });

  return result.rows.map(formatPacienteResult);
}

// Recuperar paciente por ID
async function getById(id) {
  const query = {
    text: `
      SELECT 
        p.*,
        t.id as terapeuta_id,
        t.nome as terapeuta_nome,
        t.telefone as terapeuta_telefone,
        t.email as terapeuta_email,
        t.crp as terapeuta_crp,
        t.dt_nascimento as terapeuta_dt_nascimento,
        t.dt_entrada as terapeuta_dt_entrada,
        t.chave_pix as terapeuta_chave_pix,
        t.foto as terapeuta_foto
      FROM pacientes p
      LEFT JOIN terapeutas t ON p.terapeuta_id = t.id
      WHERE p.id = $1
    `,
    values: [id],
  };

  const result = await database.query(query);

  if (result.rows.length === 0) {
    return null;
  }

  return formatPacienteResult(result.rows[0]);
}

function formatPacienteResult(row) {
  const paciente = {
    id: row.id,
    nome: row.nome,
    dt_nascimento: row.dt_nascimento,
    terapeuta_id: row.terapeuta_id,
    nome_responsavel: row.nome_responsavel,
    telefone_responsavel: row.telefone_responsavel,
    origem: row.origem,
    dt_entrada: row.dt_entrada,
    nf_nome_completo: row.nf_nome_completo,
    nf_telefone: row.nf_telefone,
    nf_cpf: row.nf_cpf,
    nf_email: row.nf_email,
    nf_endereco: row.nf_endereco,
    nf_dt_entrada: row.nf_dt_entrada,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };

  // Adicionar informações do terapeuta apenas se existir
  if (row.terapeuta_id) {
    paciente.terapeutaInfo = {
      id: row.terapeuta_id,
      nome: row.terapeuta_nome,
      telefone: row.terapeuta_telefone,
      email: row.terapeuta_email,
      crp: row.terapeuta_crp,
      dt_nascimento: row.terapeuta_dt_nascimento,
      dt_entrada: row.terapeuta_dt_entrada,
      chave_pix: row.terapeuta_chave_pix,
      foto: row.terapeuta_foto,
    };
  }

  return paciente;
}

async function update(id, pacienteInputValues) {
  const result = await database.query({
    text: `
      WITH updated AS (
        UPDATE pacientes
        SET
          nome = $1,
          dt_nascimento = $2,
          terapeuta_id = $3,
          nome_responsavel = $4,
          telefone_responsavel = $5,
          origem = $6,
          dt_entrada = $7,
          nf_nome_completo = $8,
          nf_telefone = $9,
          nf_cpf = $10,
          nf_email = $11,
          nf_endereco = $12,
          nf_dt_entrada = $13,
          updated_at = timezone('utc', now())
        WHERE id = $14
        RETURNING *
      )
      SELECT
        updated.*,
        t.id as terapeuta_id,
        t.nome as terapeuta_nome,
        t.telefone as terapeuta_telefone,
        t.email as terapeuta_email,
        t.crp as terapeuta_crp,
        t.dt_nascimento as terapeuta_dt_nascimento,
        t.dt_entrada as terapeuta_dt_entrada,
        t.chave_pix as terapeuta_chave_pix,
        t.foto as terapeuta_foto
      FROM updated
      LEFT JOIN terapeutas t ON updated.terapeuta_id = t.id
    `,
    values: [
      pacienteInputValues.nome,
      pacienteInputValues.dt_nascimento,
      pacienteInputValues.terapeuta_id,
      pacienteInputValues.nome_responsavel,
      pacienteInputValues.telefone_responsavel,
      pacienteInputValues.origem,
      pacienteInputValues.dt_entrada,
      pacienteInputValues.nf_nome_completo,
      pacienteInputValues.nf_telefone,
      pacienteInputValues.nf_cpf,
      pacienteInputValues.nf_email,
      pacienteInputValues.nf_endereco,
      pacienteInputValues.nf_dt_entrada,
      id,
    ],
  });

  if (result.rowCount === 0) {
    throw new NotFoundError({
      message: "Paciente não encontrado",
      action: "Verifique o ID e tente novamente",
    });
  }

  return formatPacienteResult(result.rows[0]);
}

async function remove(id) {
  const queryObject = {
    text: `DELETE FROM pacientes WHERE id = $1 RETURNING *`,
    values: [id],
  };

  const result = await database.query(queryObject);
  return result.rows[0];
}

async function getByTerapeutaId(terapeutaId) {
  return getFiltered({ terapeuta_id: terapeutaId });
}

const paciente = {
  create,
  getAll,
  getById,
  getFiltered,
  getByTerapeutaId,
  update,
  remove,
};

export default paciente;
