/**
 * Script para testar a função getBaseUrl em diferentes ambientes
 */

import {
  getBaseUrl,
  generateInviteLink,
  getEnvironmentInfo,
} from "../utils/getBaseUrl.js";

function testGetBaseUrl() {
  console.log("🧪 Testando função getBaseUrl\n");

  // Informações do ambiente atual
  const envInfo = getEnvironmentInfo();
  console.log("📊 Informações do ambiente:");
  console.log(JSON.stringify(envInfo, null, 2));

  // Teste de URL base
  const baseUrl = getBaseUrl();
  console.log(`\n🌐 URL Base calculada: ${baseUrl}`);

  // Teste de link de convite
  const testCode = "ABC123XYZ";
  const inviteLink = generateInviteLink(testCode);
  console.log(`📧 Link de convite de teste: ${inviteLink}`);

  // Validações
  console.log("\n✅ Validações:");
  console.log(
    `- URL contém protocolo: ${baseUrl.startsWith("http") ? "✅" : "❌"}`,
  );
  console.log(
    `- Link de convite válido: ${inviteLink.includes("/register?code=") ? "✅" : "❌"}`,
  );
  console.log(
    `- Código presente no link: ${inviteLink.includes(testCode) ? "✅" : "❌"}`,
  );
}

// Executar teste
if (import.meta.url === `file://${process.argv[1]}`) {
  testGetBaseUrl();
}

export { testGetBaseUrl };
