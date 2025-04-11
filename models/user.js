import database from "infra/database.js";
import { ValidationError, NotFoundError } from "infra/errors.js";
import { hashPassword } from "../utils/auth.js";

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

async function findOneByEmail(email) {
  const results = await database.query({
    text: `
    SELECT
      *
    FROM
      users
    WHERE
      LOWER(email) = LOWER($1)
    LIMIT
      1
    ;`,
    values: [email],
  });

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: "Usuário não encontrado.",
      action: "Verifique se o email informado está correto.",
    });
  }

  return results.rows[0];
}

async function create(userInputValues) {
  await validateUniqueEmail(userInputValues.email);
  await validateUniqueUsername(userInputValues.username);

  // Hash da senha antes de salvar
  const hashedPassword = await hashPassword(userInputValues.password);
  const userWithHashedPassword = {
    ...userInputValues,
    password: hashedPassword,
  };

  const newUser = await runInsertQuery(userWithHashedPassword);

  // Não retorne a senha no resultado
  const userWithoutPassword = { ...newUser };
  delete userWithoutPassword.password;
  return userWithoutPassword;

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
    // Incluir o role com o valor padrão "user" se não for especificado
    const role = userInputValues.role || "user";

    // Verificar se a coluna 'name' existe na tabela
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
          users (username, email, password, name, role)
        VALUES
          ($1, $2, $3, $4, $5)
        RETURNING
          *
        ;`,
        values: [
          userInputValues.username,
          userInputValues.email,
          userInputValues.password,
          userInputValues.name || "",
          role,
        ],
      });
      return results.rows[0];
    } else {
      const results = await database.query({
        text: `
        INSERT INTO
          users (username, email, password, role)
        VALUES
          ($1, $2, $3, $4)
        RETURNING
          *
        ;`,
        values: [
          userInputValues.username,
          userInputValues.email,
          userInputValues.password,
          role,
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
    // Verificar se existem campos para atualizar
    if (!updateData || Object.keys(updateData).length === 0) {
      throw new ValidationError({
        message: "Nenhum campo fornecido para atualização.",
        action: "Forneça pelo menos um campo para atualizar o usuário.",
      });
    }

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

    // Verificar novamente após filtrar valores undefined
    if (!setClause) {
      throw new ValidationError({
        message: "Nenhum campo válido fornecido para atualização.",
        action: "Forneça pelo menos um campo válido para atualizar o usuário.",
      });
    }

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
  findOneByEmail,
  update,
  delete: deleteUser,
};

export default user;
