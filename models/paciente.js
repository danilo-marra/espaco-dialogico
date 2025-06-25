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
        email_responsavel, 
        cpf_responsavel, 
        endereco_responsavel, 
        origem, 
        dt_entrada
      )
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING
      *
    ;`,
      values: [
        pacienteInputValues.nome,
        pacienteInputValues.dt_nascimento,
        pacienteInputValues.terapeuta_id,
        pacienteInputValues.nome_responsavel,
        pacienteInputValues.telefone_responsavel,
        pacienteInputValues.email_responsavel,
        pacienteInputValues.cpf_responsavel,
        pacienteInputValues.endereco_responsavel,
        pacienteInputValues.origem,
        pacienteInputValues.dt_entrada,
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
        t.endereco as terapeuta_endereco,
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
  return result.rows.map((row) => {
    const paciente = {
      id: row.id,
      nome: row.nome,
      dt_nascimento: row.dt_nascimento,
      terapeuta_id: row.terapeuta_id,
      nome_responsavel: row.nome_responsavel,
      telefone_responsavel: row.telefone_responsavel,
      email_responsavel: row.email_responsavel,
      cpf_responsavel: row.cpf_responsavel,
      endereco_responsavel: row.endereco_responsavel,
      origem: row.origem,
      dt_entrada: row.dt_entrada,
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
        endereco: row.terapeuta_endereco,
        dt_entrada: row.terapeuta_dt_entrada,
        chave_pix: row.terapeuta_chave_pix,
        foto: row.terapeuta_foto,
      };
    }

    return paciente;
  });
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
        t.endereco as terapeuta_endereco,
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

  const row = result.rows[0];
  const paciente = {
    id: row.id,
    nome: row.nome,
    dt_nascimento: row.dt_nascimento,
    terapeuta_id: row.terapeuta_id,
    nome_responsavel: row.nome_responsavel,
    telefone_responsavel: row.telefone_responsavel,
    email_responsavel: row.email_responsavel,
    cpf_responsavel: row.cpf_responsavel,
    endereco_responsavel: row.endereco_responsavel,
    origem: row.origem,
    dt_entrada: row.dt_entrada,
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
      endereco: row.terapeuta_endereco,
      dt_entrada: row.terapeuta_dt_entrada,
      chave_pix: row.terapeuta_chave_pix,
      foto: row.terapeuta_foto,
    };
  }

  return paciente;
}

async function update(id, pacienteInputValues) {
  // Primeiro, buscar o paciente existente
  const currentPaciente = await getById(id);

  // Se não encontrar o paciente, lançar erro
  if (!currentPaciente) {
    throw new NotFoundError({
      message: "Paciente não encontrado",
      action: "Verifique o ID e tente novamente",
    });
  }

  const queryObject = {
    text: `
      UPDATE pacientes
      SET
        nome = $1,
        dt_nascimento = $2,
        terapeuta_id = $3,
        nome_responsavel = $4,
        telefone_responsavel = $5,
        email_responsavel = $6,
        cpf_responsavel = $7,
        endereco_responsavel = $8,
        origem = $9,
        dt_entrada = $10,
        updated_at = timezone('utc', now())
      WHERE id = $11
      RETURNING *
    `,
    values: [
      pacienteInputValues.nome,
      pacienteInputValues.dt_nascimento,
      pacienteInputValues.terapeuta_id,
      pacienteInputValues.nome_responsavel,
      pacienteInputValues.telefone_responsavel,
      pacienteInputValues.email_responsavel,
      pacienteInputValues.cpf_responsavel,
      pacienteInputValues.endereco_responsavel,
      pacienteInputValues.origem,
      pacienteInputValues.dt_entrada,
      id,
    ],
  };

  const result = await database.query(queryObject);
  return result.rows[0];
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
  const query = {
    text: `
      SELECT 
        p.*,
        t.id as terapeuta_id,
        t.nome as terapeuta_nome,
        t.telefone as terapeuta_telefone,
        t.email as terapeuta_email,
        t.endereco as terapeuta_endereco,
        t.dt_entrada as terapeuta_dt_entrada,
        t.chave_pix as terapeuta_chave_pix,
        t.foto as terapeuta_foto
      FROM pacientes p
      LEFT JOIN terapeutas t ON p.terapeuta_id = t.id
      WHERE p.terapeuta_id = $1
      ORDER BY p.nome
    `,
    values: [terapeutaId],
  };

  const result = await database.query(query);

  // Transformar os resultados para incluir o objeto terapeutaInfo
  return result.rows.map((row) => {
    const paciente = {
      id: row.id,
      nome: row.nome,
      dt_nascimento: row.dt_nascimento,
      terapeuta_id: row.terapeuta_id,
      nome_responsavel: row.nome_responsavel,
      telefone_responsavel: row.telefone_responsavel,
      email_responsavel: row.email_responsavel,
      cpf_responsavel: row.cpf_responsavel,
      endereco_responsavel: row.endereco_responsavel,
      origem: row.origem,
      dt_entrada: row.dt_entrada,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };

    // Adicionar informações do terapeuta
    if (row.terapeuta_id) {
      paciente.terapeutaInfo = {
        id: row.terapeuta_id,
        nome: row.terapeuta_nome,
        telefone: row.terapeuta_telefone,
        email: row.terapeuta_email,
        endereco: row.terapeuta_endereco,
        dt_entrada: row.terapeuta_dt_entrada,
        chave_pix: row.terapeuta_chave_pix,
        foto: row.terapeuta_foto,
      };
    }

    return paciente;
  });
}

const paciente = {
  create,
  getAll,
  getById,
  getByTerapeutaId,
  update,
  remove,
};

export default paciente;
