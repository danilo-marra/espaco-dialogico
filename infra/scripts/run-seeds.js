/**
 * Script para executar todos os scripts de seed para o ambiente de desenvolvimento
 *
 * Este script centraliza a execução de todos os scripts de seed disponíveis
 * para facilitar a criação de um ambiente de desenvolvimento completo.
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

// Carrega variáveis de ambiente do arquivo .env.development
dotenv.config({ path: path.resolve(process.cwd(), ".env.development") });

console.log("\n🌱 Iniciando a execução de todos os scripts de seed...\n");

// Verifica se estamos em ambiente de produção e bloqueia execução
if (process.env.NODE_ENV === "production") {
  console.error(
    "❌ ERRO: Os scripts de seed não devem ser executados em ambiente de produção!",
  );
  process.exit(1);
}

// Função para executar script de seed
function runSeed(scriptName) {
  console.log(`\n🔄 Executando seed: ${scriptName}...\n`);

  try {
    execSync(`node ${path.join("infra", "scripts", scriptName)}`, {
      stdio: "inherit",
      env: process.env,
    });
    console.log(`✅ Script ${scriptName} executado com sucesso!\n`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao executar o script ${scriptName}:`);
    console.error(error.message);
    return false;
  }
}

// Lista de scripts de seed disponíveis (com ordem de execução específica se necessário)
const seedScripts = [
  "seed-terapeutas.js",
  "seed-pacientes.js",
  //"seed-sessoes.js",
  "seed-agendamentos.js",
  // etc.
];

// Contadores de resultados
let successCount = 0;
let errorCount = 0;

// Executa cada script de seed
seedScripts.forEach((script) => {
  if (fs.existsSync(path.join(process.cwd(), "infra", "scripts", script))) {
    const success = runSeed(script);
    if (success) successCount++;
    else errorCount++;
  } else {
    console.warn(`⚠️ Script ${script} não encontrado. Pulando...`);
    errorCount++;
  }
});

// Exibe resumo da execução
console.log("\n📊 Resumo da execução dos scripts de seed:");
console.log(`   ✅ ${successCount} script(s) executado(s) com sucesso`);
console.log(`   ❌ ${errorCount} script(s) com falha ou não encontrado(s)\n`);

if (errorCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
