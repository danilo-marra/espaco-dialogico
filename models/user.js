import database from "infra/database.js";
import { ValidationError, NotFoundError } from "infra/errors.js";
import bcrypt from "bcrypt";
import speakeasy from "speakeasy";

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

  const hashedPassword = await bcrypt.hash(userInputValues.password, 10);
  userInputValues.password = hashedPassword;

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

async function generateMfaSecret(userId) {
  const secret = speakeasy.generateSecret({ length: 20 });
  await database.query({
    text: `
    UPDATE
      users
    SET
      mfa_secret = $1,
      is_mfa_enabled = true
    WHERE
      id = $2
    ;`,
    values: [secret.base32, userId],
  });

  return secret.otpauth_url;
}

async function verifyMfaToken(userId, token) {
  const results = await database.query({
    text: `
    SELECT
      mfa_secret
    FROM
      users
    WHERE
      id = $1
    ;`,
    values: [userId],
  });

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: "Usuário não encontrado.",
      action: "Verifique se o userId informado está correto.",
    });
  }

  const { mfa_secret } = results.rows[0];
  return speakeasy.totp.verify({
    secret: mfa_secret,
    encoding: "base32",
    token,
  });
}

const user = {
  create,
  findOneByUsername,
  generateMfaSecret,
  verifyMfaToken,
};

export default user;
