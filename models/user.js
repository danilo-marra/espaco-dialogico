import database from "infra/database.js";
import { ValidationError, NotFoundError } from "infra/errors.js";

async function getAll() {
  const results = await database.query({
    text: `
    SELECT
      *
    FROM
      users
    ORDER BY
      id
    ;`,
  });

  return results.rows;
}

async function findOneByUsername(username) {
  const userFound = await runSelectQuery(username);

  return userFound;

  async function runSelectQuery(username) {
    const results = await database.query({
      text: `
      SELECT
        *
      FROM
        users
      WHERE
        LOWER(username) = LOWER($1)
      LIMIT
        1
      ;`,
      values: [username],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "Usuário não encontrado.",
        action: "Verifique se o username informado está correto.",
      });
    }

    return results.rows[0];
  }
}

async function create(userInputValues) {
  await validateUniqueEmail(userInputValues.email);
  await validateUniqueUsername(userInputValues.username);

  const newUser = await runInsertQuery(userInputValues);
  return newUser;

  async function validateUniqueEmail(email) {
    const results = await database.query({
      text: `
      SELECT
        email
      FROM
        users
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

  async function validateUniqueUsername(username) {
    const results = await database.query({
      text: `
      SELECT
        username
      FROM
        users
      WHERE
        LOWER(username) = LOWER($1)
      ;`,
      values: [username],
    });

    if (results.rowCount > 0) {
      throw new ValidationError({
        message: "O username informado já está sendo utilizado.",
        action: "Utilize outro username para realizar o cadastro.",
      });
    }
  }

  async function runInsertQuery(userInputValues) {
    const tableInfoResults = await database.query({
      text: `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'name';
      `,
    });

    if (tableInfoResults.rowCount > 0) {
      const results = await database.query({
        text: `
        INSERT INTO
          users (username, email, password, name)
        VALUES
          ($1, $2, $3, $4)
        RETURNING
          *
        ;`,
        values: [
          userInputValues.username,
          userInputValues.email,
          userInputValues.password,
          userInputValues.name || "",
        ],
      });
      return results.rows[0];
    } else {
      const results = await database.query({
        text: `
        INSERT INTO
          users (username, email, password)
        VALUES
          ($1, $2, $3)
        RETURNING
          *
        ;`,
        values: [
          userInputValues.username,
          userInputValues.email,
          userInputValues.password,
        ],
      });
      return results.rows[0];
    }
  }
}

async function update(username, updateData) {
  // Verificar se o usuário existe
  await findOneByUsername(username);

  // Se estiver atualizando email ou username, verificar se já não existem
  if (updateData.email) {
    await validateUniqueEmailExcept(updateData.email, username);
  }

  if (updateData.username && updateData.username !== username) {
    await validateUniqueUsername(updateData.username);
  }

  // Atualizar usuário
  const updatedUser = await runUpdateQuery(username, updateData);
  return updatedUser;

  async function validateUniqueEmailExcept(email, currentUsername) {
    const results = await database.query({
      text: `
      SELECT
        email
      FROM
        users
      WHERE
        LOWER(email) = LOWER($1)
        AND LOWER(username) != LOWER($2)
      ;`,
      values: [email, currentUsername],
    });

    if (results.rowCount > 0) {
      throw new ValidationError({
        message: "O email informado já está sendo utilizado por outro usuário.",
        action: "Utilize outro email para realizar a atualização.",
      });
    }
  }

  async function validateUniqueUsername(username) {
    const results = await database.query({
      text: `
      SELECT
        username
      FROM
        users
      WHERE
        LOWER(username) = LOWER($1)
      ;`,
      values: [username],
    });

    if (results.rowCount > 0) {
      throw new ValidationError({
        message: "O username informado já está sendo utilizado.",
        action: "Utilize outro username para realizar a atualização.",
      });
    }
  }

  async function runUpdateQuery(username, updateData) {
    // Construir a query dinamicamente com base nos campos fornecidos
    let setClause = "";
    const values = [];
    let paramIndex = 1;

    Object.keys(updateData).forEach((key) => {
      if (updateData[key] !== undefined) {
        setClause += `${setClause ? ", " : ""}${key} = $${paramIndex}`;
        values.push(updateData[key]);
        paramIndex++;
      }
    });

    values.push(username);

    const results = await database.query({
      text: `
      UPDATE
        users
      SET
        ${setClause}
      WHERE
        LOWER(username) = LOWER($${paramIndex})
      RETURNING
        *
      ;`,
      values: values,
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "Não foi possível atualizar o usuário.",
        action: "Verifique se o username informado está correto.",
      });
    }

    return results.rows[0];
  }
}

async function deleteUser(username) {
  // Verificar se o usuário existe
  await findOneByUsername(username);

  // Excluir usuário
  await runDeleteQuery(username);

  async function runDeleteQuery(username) {
    const results = await database.query({
      text: `
      DELETE FROM
        users
      WHERE
        LOWER(username) = LOWER($1)
      ;`,
      values: [username],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "Não foi possível excluir o usuário.",
        action: "Verifique se o username informado está correto.",
      });
    }
  }
}

const user = {
  getAll,
  create,
  findOneByUsername,
  update,
  delete: deleteUser,
};

export default user;
