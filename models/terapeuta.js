import database from "infra/database.js";
import { NotFoundError, ValidationError } from "infra/errors";

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
        terapeutaInputValues.foto || null,
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

// Recuperar terapeuta por ID
async function getById(id) {
  const queryObject = {
    text: `SELECT * FROM terapeutas WHERE id = $1`,
    values: [id],
  };

  const result = await database.query(queryObject);
  return result.rows[0] || null;
}

// Recuperar terapeuta por email
async function getByEmail(email) {
  const queryObject = {
    text: `SELECT * FROM terapeutas WHERE LOWER(email) = LOWER($1)`,
    values: [email],
  };

  const result = await database.query(queryObject);
  return result.rows[0] || null;
}

// Vincular usuário ao terapeuta
async function linkUser(terapeutaId, userId) {
  const queryObject = {
    text: `
      UPDATE terapeutas
      SET user_id = $1
      WHERE id = $2
      RETURNING *
    `,
    values: [userId, terapeutaId],
  };

  const result = await database.query(queryObject);
  return result.rows[0];
}

// Buscar terapeuta por user_id
async function getByUserId(userId) {
  const queryObject = {
    text: `SELECT * FROM terapeutas WHERE user_id = $1`,
    values: [userId],
  };

  const result = await database.query(queryObject);
  return result.rows[0] || null;
}

async function update(id, terapeutaInputValues) {
  // Primeiro, buscar o terapeuta existente para obter a foto atual
  const currentTerapeuta = await getById(id);

  // Se não encontrar o terapeuta, lançar erro
  if (!currentTerapeuta) {
    throw new NotFoundError({
      message: "Terapeuta não encontrado",
      action: "Verifique o ID e tente novamente",
    });
  }

  // Primeiro, verificar se o email já existe em outro terapeuta
  if (terapeutaInputValues.email) {
    const checkEmailQuery = {
      text: `
        SELECT
          id
        FROM
          terapeutas
        WHERE
          LOWER(email) = LOWER($1)
          AND id != $2
      `,
      values: [terapeutaInputValues.email, id],
    };
    const emailResults = await database.query(checkEmailQuery);
    if (emailResults.rowCount > 0) {
      throw new ValidationError({
        message: "O email informado já está sendo utilizado.",
        action: "Utilize outro email para realizar a atualização.",
      });
    }
  }

  // Atualizar o terapeuta
  // Se a foto não for enviada, manter o valor atual
  // Se a foto for enviada, fazer o upload para o Cloudinary

  const fotoToUse =
    terapeutaInputValues.foto !== undefined
      ? terapeutaInputValues.foto
      : currentTerapeuta.foto;

  // Manter user_id existente se não for fornecido um novo
  const userIdToUse =
    terapeutaInputValues.user_id !== undefined
      ? terapeutaInputValues.user_id
      : currentTerapeuta.user_id;

  const queryObject = {
    text: `
      UPDATE terapeutas
      SET
        nome = $1,
        foto = $2,
        telefone = $3,
        email = $4,
        endereco = $5,
        dt_entrada = $6,
        chave_pix = $7,
        user_id = $8
      WHERE id = $9
      RETURNING *
    `,
    values: [
      terapeutaInputValues.nome,
      fotoToUse,
      terapeutaInputValues.telefone,
      terapeutaInputValues.email,
      terapeutaInputValues.endereco,
      terapeutaInputValues.dt_entrada,
      terapeutaInputValues.chave_pix,
      userIdToUse,
      id,
    ],
  };

  const result = await database.query(queryObject);
  return result.rows[0];
}

async function remove(id) {
  const queryObject = {
    text: `DELETE FROM terapeutas WHERE id = $1 RETURNING *`,
    values: [id],
  };

  const result = await database.query(queryObject);
  return result.rows[0];
}

// Criar registro de terapeuta baseado em dados do usuário
async function createFromUser(userData) {
  // Validar se o email não está sendo usado
  const existingTerapeuta = await getByEmail(userData.email);

  if (existingTerapeuta) {
    if (!existingTerapeuta.user_id) {
      // Se existe mas não tem user_id, vincular
      console.log(
        `[VINCULAÇÃO] Terapeuta existente encontrado, vinculando user_id ${userData.user_id}`,
      );
      return await linkUser(existingTerapeuta.id, userData.user_id);
    } else {
      // Se já tem user_id, retornar erro
      throw new ValidationError({
        message: "Já existe um terapeuta cadastrado com este email.",
        action: "Verifique se o terapeuta já está associado a outro usuário.",
      });
    }
  }

  const queryObject = {
    text: `
      INSERT INTO terapeutas (user_id, nome, email, dt_entrada, telefone, endereco, foto, chave_pix)
      VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7)
      RETURNING *
    `,
    values: [
      userData.user_id,
      userData.nome,
      userData.email,
      userData.telefone || "(não informado)", // Campo obrigatório - valor padrão
      userData.endereco || "(não informado)", // Campo obrigatório - valor padrão
      userData.foto || null,
      userData.chave_pix || "(não informado)", // Campo obrigatório - valor padrão
    ],
  };

  const result = await database.query(queryObject);
  return result.rows[0];
}

const terapeuta = {
  create,
  getAll,
  getById,
  getByEmail,
  linkUser,
  getByUserId,
  update,
  remove,
  createFromUser,
};

export default terapeuta;
