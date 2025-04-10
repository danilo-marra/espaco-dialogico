import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Hash de senha
export async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

// Verificar senha
export async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

// Gerar token JWT
export function generateToken(user) {
  const secret = process.env.JWT_SECRET || "sua_chave_secreta_temporaria";
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
    },
    secret,
    { expiresIn: "7d" },
  );
}

// Verificar token JWT
export function verifyToken(token) {
  const secret = process.env.JWT_SECRET || "sua_chave_secreta_temporaria";
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
}
