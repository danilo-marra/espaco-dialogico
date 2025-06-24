const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);

console.log("🚀 ADICIONANDO REGISTRO SPF - VERCEL");
console.log("===================================");

async function addSPFRecord() {
  try {
    console.log("\n📤 Adicionando registro SPF...");

    // Comando ajustado para Windows PowerShell
    const command = `vercel dns add espacodialogico.com.br "@" TXT "v=spf1 include:_spf.google.com ~all"`;
    console.log("🔧 Executando:", command);

    const result = await execPromise(command, {
      shell: "cmd.exe", // Força usar CMD em vez de PowerShell
    });

    console.log("✅ Registro SPF adicionado com sucesso!");
    console.log(result.stdout);

    // Aguardar 2 segundos e verificar
    console.log("\n⏱️ Aguardando propagação...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log("\n🔍 Verificando registros atualizados...");
    const verifyResult = await execPromise(
      "vercel dns ls espacodialogico.com.br",
    );
    console.log(verifyResult.stdout);
  } catch (error) {
    console.log("❌ Erro ao adicionar SPF:", error.message);

    if (error.message.includes("login")) {
      console.log("\n🔑 Faça login primeiro:");
      console.log("vercel login");
    } else if (error.message.includes("already exists")) {
      console.log("\n✅ Registro SPF já existe!");
    } else {
      console.log("\n🛠️ Tente manualmente:");
      console.log(
        'vercel dns add espacodialogico.com.br "@" TXT "v=spf1 include:_spf.google.com ~all"',
      );
    }
  }
}

addSPFRecord();
