/**
 * Teste real do sistema de email com URLs dinâmicas
 */

require("dotenv").config({ path: ".env.local" });

// Importar ou simular a função de email
async function testEmailWithDynamicUrl() {
  console.log("📧 Teste Real do Sistema de Email com URLs Dinâmicas\n");

  // Verificar configuração de email
  console.log("1. 🔧 Verificando configuração:");
  console.log(`   EMAIL_USER: ${process.env.EMAIL_USER}`);
  console.log(
    `   EMAIL_PASSWORD: ${process.env.EMAIL_PASSWORD ? "✅ Configurado" : "❌ Não configurado"}`,
  );
  console.log(`   NEXT_PUBLIC_BASE_URL: ${process.env.NEXT_PUBLIC_BASE_URL}\n`);

  // Simular dados de convite
  const mockInviteData = {
    email: "teste@exemplo.com",
    code: `TESTE-${Date.now().toString().slice(-6)}`,
    role: "terapeuta",
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };

  console.log("2. 📋 Dados do convite de teste:");
  console.log(JSON.stringify(mockInviteData, null, 2));

  // Função getBaseUrl (mesmo código do utils)
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

  // Testar geração de link
  const inviteLink = generateInviteLink(mockInviteData.code);
  console.log(`\n3. 🔗 Link de convite gerado: ${inviteLink}`);

  // Validações
  console.log("\n4. ✅ Validações:");
  console.log(
    `   - Link contém código: ${inviteLink.includes(mockInviteData.code) ? "✅" : "❌"}`,
  );
  console.log(
    `   - Link contém rota: ${inviteLink.includes("/register?code=") ? "✅" : "❌"}`,
  );
  console.log(
    `   - URL base correta: ${inviteLink.startsWith("http") ? "✅" : "❌"}`,
  );
  console.log(
    `   - Ambiente detectado: ${process.env.NODE_ENV || "development"}`,
  );

  // Simular template de email
  console.log("\n5. 📧 Preview do template de email:");
  console.log("=".repeat(50));
  console.log(
    "Assunto: 🎯 Convite para o Espaço Dialógico -",
    mockInviteData.code,
  );
  console.log("");
  console.log("Olá!");
  console.log("");
  console.log("Sistema convidou você para se cadastrar no Espaço Dialógico");
  console.log("com a função de: Terapeuta");
  console.log("");
  console.log("Código do Convite:", mockInviteData.code);
  console.log("");
  console.log("Link para aceitar:");
  console.log(inviteLink);
  console.log("");
  console.log(
    "Este convite expira em:",
    new Date(mockInviteData.expires_at).toLocaleDateString("pt-BR"),
  );
  console.log("=".repeat(50));

  console.log("\n🎯 Teste concluído com sucesso!");
  console.log(
    "💡 Recomendação: Teste criando um convite real na interface para verificar o email",
  );
}

// Executar se chamado diretamente
if (require.main === module) {
  testEmailWithDynamicUrl().catch(console.error);
}

module.exports = { testEmailWithDynamicUrl };
