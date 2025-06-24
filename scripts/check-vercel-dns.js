const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);

console.log("🔍 VERIFICAÇÃO DNS VERCEL - ESPAÇO DIALÓGICO");
console.log("===========================================");

async function checkVercelDNS() {
  try {
    // Verificar se Vercel CLI está instalado
    console.log("\n🔧 Verificando Vercel CLI...");
    await execPromise("vercel --version");
    console.log("✅ Vercel CLI encontrado");

    // Listar registros DNS
    console.log("\n📋 Listando registros DNS atuais...");
    const dnsResult = await execPromise("vercel dns ls espacodialogico.com.br");
    console.log(dnsResult.stdout);
  } catch (error) {
    if (error.message.includes("vercel")) {
      console.log("❌ Vercel CLI não encontrado");
      console.log("📦 Para instalar: npm i -g vercel");
    } else {
      console.log("❌ Erro:", error.message);
    }
  }
}

checkVercelDNS();
