import database from "infra/database.js";
import { NotFoundError, ValidationError } from "infra/errors";

async function create(pacienteInputValues) {
  await validateUniqueEmail(pacienteInputValues.email);

  const newPaciente = await runInsertQuery(pacienteInputValues);
  return newPaciente;

  async function validateUniqueEmail(email) {
    const results = await database.query({
      text: `
      SELECT
        email
      FROM
        pacientes
      WHERE
        LOWER(email) = LOWER($1)
      ;`,
      values: [email],
    });

    if (results.rowCount > 0) {
      throw new ValidationError({
        message: "O email informado já está sendo utilizado.",
        action: "Utilize outro email para realizar o cadastro.",
      });
    }
  }

  async function runInsertQuery(pacienteInputValues) {
    const results = await database.query({
      text: `
    INSERT INTO
      pacientes (nome, foto, telefone, email, endereco, data_nascimento, observacoes)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7)
    RETURNING
      *
    ;`,
      values: [
        pacienteInputValues.nome,
        pacienteInputValues.foto || null,
        pacienteInputValues.telefone,
        pacienteInputValues.email,
        pacienteInputValues.endereco,
        pacienteInputValues.data_nascimento,
        pacienteInputValues.observacoes || null,
      ],
    });

    return results.rows[0];
  }
}

async function getAll() {
  const results = await database.query({
    text: `
    SELECT
      *
    FROM
      pacientes
    ;`,
  });

  return results.rows;
}

// Recuperar paciente por ID
async function getById(id) {
  const queryObject = {
    text: `SELECT * FROM pacientes WHERE id = $1`,
    values: [id],
  };

  const result = await database.query(queryObject);
  return result.rows[0] || null;
}

async function update(id, pacienteInputValues) {
  // Primeiro, buscar o paciente existente para obter a foto atual
  const currentPaciente = await getById(id);

  // Se não encontrar o paciente, lançar erro
  if (!currentPaciente) {
    throw new NotFoundError({
      message: "Paciente não encontrado",
      action: "Verifique o ID e tente novamente",
    });
  }

  // Primeiro, verificar se o email já existe em outro paciente
  if (pacienteInputValues.email) {
    const checkEmailQuery = {
      text: `
        SELECT
          id
        FROM
          pacientes
        WHERE
          LOWER(email) = LOWER($1)
          AND id != $2
      `,
      values: [pacienteInputValues.email, id],
    };
    const emailResults = await database.query(checkEmailQuery);
    if (emailResults.rowCount > 0) {
      throw new ValidationError({
        message: "O email informado já está sendo utilizado.",
        action: "Utilize outro email para realizar a atualização.",
      });
    }
  }

  // Atualizar o paciente
  // Se a foto não for enviada, manter o valor atual
  const fotoToUse =
    pacienteInputValues.foto !== undefined
      ? pacienteInputValues.foto
      : currentPaciente.foto;

  const queryObject = {
    text: `
      UPDATE pacientes
      SET
        nome = $1,
        foto = $2,
        telefone = $3,
        email = $4,
        endereco = $5,
        data_nascimento = $6,
        observacoes = $7
      WHERE id = $8
      RETURNING *
    `,
    values: [
      pacienteInputValues.nome,
      fotoToUse,
      pacienteInputValues.telefone,
      pacienteInputValues.email,
      pacienteInputValues.endereco,
      pacienteInputValues.data_nascimento,
      pacienteInputValues.observacoes,
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
