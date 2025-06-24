/**
 * Script para testar a função getBaseUrl em diferentes ambientes
 * Versão CommonJS compatível com Node.js
 */

require("dotenv").config({ path: ".env.local" });

// Simular diferentes ambientes para teste
function simulateEnvironment(env, vercelUrl = null, publicUrl = null) {
  const originalEnv = process.env.NODE_ENV;
  const originalVercel = process.env.VERCEL_URL;
  const originalPublic = process.env.NEXT_PUBLIC_BASE_URL;

  // Configurar ambiente simulado
  process.env.NODE_ENV = env;
  if (vercelUrl) process.env.VERCEL_URL = vercelUrl;
  if (publicUrl) process.env.NEXT_PUBLIC_BASE_URL = publicUrl;

  // Função getBaseUrl inline (mesmo código do utils/getBaseUrl.js)
  function getBaseUrl() {
    if (process.env.NODE_ENV === "production") {
      return (
        process.env.NEXT_PUBLIC_BASE_URL || "https://www.espacodialogico.com.br"
      );
    }

    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }

    return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  }

  function generateInviteLink(inviteCode) {
    const baseUrl = getBaseUrl();
    return `${baseUrl}/register?code=${inviteCode}`;
  }

  const result = {
    environment: env,
    baseUrl: getBaseUrl(),
    inviteLink: generateInviteLink("TEST123"),
    variables: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    },
  };

  // Restaurar ambiente original
  process.env.NODE_ENV = originalEnv;
  process.env.VERCEL_URL = originalVercel;
  process.env.NEXT_PUBLIC_BASE_URL = originalPublic;

  return result;
}

function testAllEnvironments() {
  console.log("🧪 Testando função getBaseUrl em todos os ambientes\n");

  // 1. Teste em Development
  console.log("🏠 DESENVOLVIMENTO:");
  const devResult = simulateEnvironment(
    "development",
    null,
    "http://localhost:3000",
  );
  console.log(`   URL Base: ${devResult.baseUrl}`);
  console.log(`   Link Convite: ${devResult.inviteLink}`);
  console.log(
    `   ✅ ${devResult.baseUrl === "http://localhost:3000" ? "CORRETO" : "ERRO"}\n`,
  );

  // 2. Teste em Preview (Vercel)
  console.log("🔍 PREVIEW (Vercel):");
  const previewResult = simulateEnvironment(
    "preview",
    "espaco-dialogico-git-test-user.vercel.app",
    null,
  );
  console.log(`   URL Base: ${previewResult.baseUrl}`);
  console.log(`   Link Convite: ${previewResult.inviteLink}`);
  console.log(
    `   ✅ ${previewResult.baseUrl.includes("vercel.app") ? "CORRETO" : "ERRO"}\n`,
  );

  // 3. Teste em Production
  console.log("🚀 PRODUÇÃO:");
  const prodResult = simulateEnvironment(
    "production",
    null,
    "https://www.espacodialogico.com.br",
  );
  console.log(`   URL Base: ${prodResult.baseUrl}`);
  console.log(`   Link Convite: ${prodResult.inviteLink}`);
  console.log(
    `   ✅ ${prodResult.baseUrl === "https://www.espacodialogico.com.br" ? "CORRETO" : "ERRO"}\n`,
  );

  // 4. Teste no ambiente atual
  console.log("🌐 AMBIENTE ATUAL:");
  const currentResult = simulateEnvironment(
    process.env.NODE_ENV || "development",
  );
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || "undefined"}`);
  console.log(`   VERCEL_URL: ${process.env.VERCEL_URL || "undefined"}`);
  console.log(
    `   NEXT_PUBLIC_BASE_URL: ${process.env.NEXT_PUBLIC_BASE_URL || "undefined"}`,
  );
  console.log(`   URL Base: ${currentResult.baseUrl}`);
  console.log(`   Link Convite: ${currentResult.inviteLink}\n`);

  // 5. Validações finais
  console.log("📋 VALIDAÇÕES:");
  const allResults = [devResult, previewResult, prodResult];

  allResults.forEach((result, index) => {
    const envNames = ["Development", "Preview", "Production"];
    const hasProtocol = result.baseUrl.startsWith("http");
    const hasValidLink = result.inviteLink.includes("/register?code=TEST123");

    console.log(
      `   ${envNames[index]}: ${hasProtocol && hasValidLink ? "✅ VÁLIDO" : "❌ INVÁLIDO"}`,
    );
  });

  console.log("\n🎯 Teste concluído!");
}

// Executar se chamado diretamente
if (require.main === module) {
  testAllEnvironments();
}

module.exports = { testAllEnvironments };
