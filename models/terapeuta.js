import database from "infra/database.js";
import { ValidationError } from "infra/errors";

async function create(terapeutaInputValues) {
  await validateUniqueEmail(terapeutaInputValues.email);

  const newTerapeuta = await runInsertQuery(terapeutaInputValues);
  return newTerapeuta;

  async function validateUniqueEmail(email) {
    const results = await database.query({
      text: `
      SELECT
        email
      FROM
        terapeutas
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

  async function runInsertQuery(terapeutaInputValues) {
    const results = await database.query({
      text: `
    INSERT INTO
      terapeutas (nome, foto, telefone, email, endereco, dt_entrada, chave_pix)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7)
    RETURNING
      *
    ;`,
      values: [
        terapeutaInputValues.nome,
        terapeutaInputValues.foto,
        terapeutaInputValues.telefone,
        terapeutaInputValues.email,
        terapeutaInputValues.endereco,
        terapeutaInputValues.dt_entrada,
        terapeutaInputValues.chave_pix,
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
      terapeutas
    ;`,
  });

  return results.rows;
}

const terapeuta = {
  create,
  getAll,
};

export default terapeuta;
