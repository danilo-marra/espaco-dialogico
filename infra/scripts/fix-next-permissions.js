#!/usr/bin/env node

/**
 * Script para corrigir problemas de permissão no diretório .next
 * Específico para Windows
 */

const { execSync } = require("child_process");
const chalk = require("chalk");
const fs = require("fs");
const path = require("path");

function fixNextPermissions() {
  const nextDir = path.join(process.cwd(), ".next");

  console.log(chalk.blue("🔧 Corrigindo permissões do diretório .next..."));

  try {
    // Verificar se o diretório existe
    if (!fs.existsSync(nextDir)) {
      console.log(
        chalk.green("✅ Diretório .next não existe, nada para corrigir."),
      );
      return;
    }

    // No Windows, usar takeown e icacls para corrigir permissões
    console.log(chalk.yellow("🔑 Tomando propriedade do diretório .next..."));

    try {
      execSync(`takeown /f "${nextDir}" /r /d y`, { stdio: "inherit" });
      console.log(chalk.green("✅ Propriedade tomada com sucesso!"));
    } catch (takeownError) {
      console.log(chalk.yellow(`⚠️ Aviso takeown: ${takeownError.message}`));
    }

    console.log(chalk.yellow("🔐 Configurando permissões completas..."));

    try {
      execSync(`icacls "${nextDir}" /grant %USERNAME%:F /t`, {
        stdio: "inherit",
      });
      console.log(chalk.green("✅ Permissões configuradas com sucesso!"));
    } catch (icaclsError) {
      console.log(chalk.yellow(`⚠️ Aviso icacls: ${icaclsError.message}`));
    } // Remover o diretório após corrigir permissões
    console.log(chalk.yellow("🗑️ Removendo diretório .next..."));
    try {
      fs.rmSync(nextDir, { recursive: true, force: true });
      console.log(chalk.green("✅ Diretório .next removido com sucesso!"));
    } catch (removeError) {
      console.log(chalk.red(`❌ Erro ao remover: ${removeError.message}`));

      // Tentar com comando do sistema - mais agressivo
      try {
        console.log(chalk.yellow("🔨 Tentando remoção forçada..."));
        execSync(`rmdir /s /q "${nextDir}"`, { stdio: "inherit" });
        console.log(
          chalk.green("✅ Diretório removido via comando do sistema!"),
        );
      } catch (rmdirError) {
        console.log(chalk.yellow(`⚠️ Aviso rmdir: ${rmdirError.message}`));

        // Última tentativa - remover arquivo trace especificamente
        try {
          const traceFile = path.join(nextDir, "trace");
          console.log(
            chalk.yellow(
              "🎯 Tentando remover arquivo trace especificamente...",
            ),
          );
          execSync(`del /f /q "${traceFile}"`, { stdio: "inherit" });

          // Tentar remover o diretório novamente
          execSync(`rmdir /s /q "${nextDir}"`, { stdio: "inherit" });
          console.log(chalk.green("✅ Sucesso na segunda tentativa!"));
        } catch (finalError) {
          console.log(
            chalk.yellow(
              "⚠️ Algumas permissões persistem, mas o principal foi resolvido.",
            ),
          );
        }
      }
    }
  } catch (error) {
    console.error(chalk.red("❌ Erro ao corrigir permissões:", error.message));
    console.log(
      chalk.yellow("💡 Tente executar este script como administrador."),
    );
    process.exit(1);
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  fixNextPermissions();
}

module.exports = { fixNextPermissions };
