import database from "infra/database.js";
import { NotFoundError, ValidationError } from "infra/errors";

async function create(pacienteInputValues) {
  await validateUniqueEmailResponsavel(pacienteInputValues.email_responsavel);

  const newPaciente = await runInsertQuery(pacienteInputValues);
  return newPaciente;

  async function validateUniqueEmailResponsavel(email) {
    const results = await database.query({
      text: `
      SELECT
        email_responsavel
      FROM
        pacientes
      WHERE
        LOWER(email_responsavel) = LOWER($1)
      ;`,
      values: [email],
    });

    if (results.rowCount > 0) {
      throw new ValidationError({
        message: "O email do responsável informado já está sendo utilizado.",
        action: "Utilize outro email para realizar o cadastro.",
      });
    }
  }

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
  const results = await database.query({
    text: `
    SELECT
      p.*,
      t.nome as terapeuta_nome
    FROM
      pacientes p
    LEFT JOIN
      terapeutas t ON p.terapeuta_id = t.id
    ;`,
  });

  return results.rows;
}

// Recuperar paciente por ID
async function getById(id) {
  const queryObject = {
    text: `
      SELECT
        p.*,
        t.nome as terapeuta_nome
      FROM
        pacientes p
      LEFT JOIN
        terapeutas t ON p.terapeuta_id = t.id
      WHERE p.id = $1
    `,
    values: [id],
  };

  const result = await database.query(queryObject);
  return result.rows[0] || null;
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

  // Verificar se o email já existe em outro paciente
  if (pacienteInputValues.email_responsavel) {
    const checkEmailQuery = {
      text: `
        SELECT
          id
        FROM
          pacientes
        WHERE
          LOWER(email_responsavel) = LOWER($1)
          AND id != $2
      `,
      values: [pacienteInputValues.email_responsavel, id],
    };
    const emailResults = await database.query(checkEmailQuery);
    if (emailResults.rowCount > 0) {
      throw new ValidationError({
        message: "O email do responsável informado já está sendo utilizado.",
        action: "Utilize outro email para realizar a atualização.",
      });
    }
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

const paciente = {
  create,
  getAll,
  getById,
  update,
  remove,
};

export default paciente;
