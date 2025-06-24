/**
 * Utilitário para obter a URL base correta baseada no ambiente
 *
 * - Produção: https://www.espacodialogico.com.br
 * - Preview Vercel: https://[deployment-url].vercel.app
 * - Desenvolvimento: http://localhost:3000
 */

export function getBaseUrl() {
  // Em produção, use a URL configurada
  if (process.env.NODE_ENV === "production") {
    return (
      process.env.NEXT_PUBLIC_BASE_URL || "https://www.espacodialogico.com.br"
    );
  }

  // No preview da Vercel, use a URL automática
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Em desenvolvimento local
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
}

/**
 * Gera um link de convite com a URL base correta
 */
export function generateInviteLink(inviteCode) {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/register?code=${inviteCode}`;
}

/**
 * Gera um link de reset de senha com a URL base correta
 */
export function generatePasswordResetLink(token) {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/reset-password?token=${token}`;
}

/**
 * Obtém informações sobre o ambiente atual (para debug)
 */
export function getEnvironmentInfo() {
  return {
    nodeEnv: process.env.NODE_ENV,
    baseUrl: getBaseUrl(),
    vercelUrl: process.env.VERCEL_URL,
    vercelBranch: process.env.VERCEL_GIT_BRANCH,
    configuredUrl: process.env.NEXT_PUBLIC_BASE_URL,
  };
}
