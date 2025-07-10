import database from "infra/database.js";
import crypto from "crypto";

// Função para gerar um hash de um token de sessão
async function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Função para criar uma nova sessão de usuário
async function create(userId, expiresInMinutes = 60 * 24 * 7) {
  // 7 dias
  // Gerar um token de sessão único e seguro
  const sessionToken = crypto.randomBytes(32).toString("hex");

  // Calcular a data de expiração
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

  // Fazer o hash do token antes de salvar no banco
  const hashedToken = await hashToken(sessionToken);

  // Inserir a sessão no banco de dados
  const result = await database.query({
    text: `
      INSERT INTO user_sessions (user_id, token, expires_at)
      VALUES ($1, $2, $3)
      RETURNING id, user_id, expires_at
    `,
    values: [userId, hashedToken, expiresAt],
  });

  // Retornar o token original (não hasheado) para o cliente
  return {
    token: sessionToken,
    session: result.rows[0],
  };
}

// Função para encontrar e validar uma sessão pelo token
async function findByToken(token) {
  const hashedToken = await hashToken(token);

  const result = await database.query({
    text: `
      SELECT * FROM user_sessions
      WHERE token = $1 AND expires_at > NOW()
    `,
    values: [hashedToken],
  });

  if (result.rowCount === 0) {
    return null;
  }

  return result.rows[0];
}

// Função para deletar uma sessão pelo token
async function deleteByToken(token) {
  const hashedToken = await hashToken(token);

  const result = await database.query({
    text: `
      DELETE FROM user_sessions
      WHERE token = $1
      RETURNING id
    `,
    values: [hashedToken],
  });

  return result.rowCount > 0;
}

const userSession = {
  create,
  findByToken,
  deleteByToken,
  hashToken,
};

export default userSession;
