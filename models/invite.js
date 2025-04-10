import database from "infra/database.js";
import { ValidationError, NotFoundError } from "infra/errors.js";
import crypto from "crypto";

// Função para gerar um código de convite aleatório
function generateInviteCode(length = 8) {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Excluindo caracteres que podem causar confusão
  let code = "";

  // Gerar código aleatório
  const randomValues = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    code += characters[randomValues[i] % characters.length];
  }

  return code;
}

async function create({ email, role = "user", expiresInDays = 7, createdBy }) {
  // Gerar um código de convite único
  let code;
  let isCodeUnique = false;

  // Tentar até gerar um código único
  while (!isCodeUnique) {
    code = generateInviteCode();

    // Verificar se o código já existe
    const existingCode = await database.query({
      text: `SELECT code FROM invites WHERE code = $1`,
      values: [code],
    });

    if (existingCode.rowCount === 0) {
      isCodeUnique = true;
    }
  }

  // Calcular a data de expiração
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  // Inserir o convite no banco de dados
  const result = await database.query({
    text: `
      INSERT INTO invites (code, email, role, expires_at, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    values: [code, email || null, role, expiresAt, createdBy || null],
  });

  return result.rows[0];
}

async function getAll() {
  const results = await database.query({
    text: `
      SELECT i.*, 
        c.username AS created_by_username,
        u.username AS used_by_username
      FROM invites i
      LEFT JOIN users c ON i.created_by = c.id
      LEFT JOIN users u ON i.used_by = u.id
      ORDER BY i.created_at DESC
    `,
  });

  return results.rows;
}

async function getByCode(code) {
  const result = await database.query({
    text: `
      SELECT * FROM invites
      WHERE code = $1
    `,
    values: [code],
  });

  if (result.rowCount === 0) {
    throw new NotFoundError({
      message: "Código de convite não encontrado ou expirado.",
      action: "Verifique o código informado ou solicite um novo convite.",
    });
  }

  return result.rows[0];
}

async function validateAndUse(code, userId) {
  // Verificar se o código existe e é válido
  const inviteResult = await database.query({
    text: `
      SELECT * FROM invites
      WHERE code = $1 AND used = FALSE AND expires_at > NOW()
    `,
    values: [code],
  });

  if (inviteResult.rowCount === 0) {
    throw new ValidationError({
      message: "Código de convite inválido ou expirado.",
      action: "Solicite um novo código de convite ao administrador.",
    });
  }

  const invite = inviteResult.rows[0];

  // Verificar se o convite foi emitido para um email específico
  if (invite.email) {
    // Esta verificação será feita no controlador, já que aqui não temos acesso ao email do usuário
    // O controlador deve passar o email do usuário e comparar com invite.email
  }

  // Marcar o convite como usado
  const updatedInvite = await database.query({
    text: `
      UPDATE invites
      SET used = TRUE, used_by = $1
      WHERE id = $2
      RETURNING *
    `,
    values: [userId, invite.id],
  });

  return { invite: updatedInvite.rows[0], role: invite.role };
}

async function deleteById(id) {
  const result = await database.query({
    text: `
      DELETE FROM invites
      WHERE id = $1
      RETURNING *
    `,
    values: [id],
  });

  if (result.rowCount === 0) {
    throw new NotFoundError({
      message: "Convite não encontrado.",
      action: "Verifique o ID informado.",
    });
  }

  return result.rows[0];
}

const invite = {
  create,
  getAll,
  getByCode,
  validateAndUse,
  deleteById,
};

export default invite;
