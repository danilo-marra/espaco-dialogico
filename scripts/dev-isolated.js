#!/usr/bin/env node

/**
 * Script para iniciar o ambiente de desenvolvimento de forma isolada
 * Evita conflitos com testes e garante um ambiente limpo
 */

const { spawn } = require("child_process");
const chalk = require("chalk");
const fs = require("fs");
const path = require("path");
const { fixNextPermissions } = require("../infra/scripts/fix-next-permissions");

async function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(chalk.yellow(`Executando: ${command} ${args.join(" ")}`));

    const childProcess = spawn(command, args, {
      stdio: "inherit",
      shell: true,
      env: { ...process.env, ...options.env },
      ...options,
    });

    childProcess.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Comando falhou com código ${code}`));
      }
    });
  });
}

async function cleanNextCache() {
  const nextDir = path.join(process.cwd(), ".next");

  console.log(chalk.blue("🧹 Limpando cache do Next.js..."));

  try {
    if (fs.existsSync(nextDir)) {
      // Primeiro, tentar corrigir permissões no Windows
      if (process.platform === "win32") {
        console.log(chalk.yellow("🔧 Corrigindo permissões no Windows..."));
        fixNextPermissions();
      } else {
        // Linux/Mac - remover diretamente
        fs.rmSync(nextDir, { recursive: true, force: true });
        console.log(chalk.green("✅ Cache do Next.js limpo com sucesso!"));
      }
    }
  } catch (error) {
    console.log(
      chalk.yellow(
        `⚠️ Aviso: Não foi possível limpar completamente o cache: ${error.message}`,
      ),
    );

    // Tentar limpar arquivos específicos que causam problemas
    try {
      const traceFile = path.join(nextDir, "trace");
      if (fs.existsSync(traceFile)) {
        fs.unlinkSync(traceFile);
        console.log(chalk.green("✅ Arquivo trace removido!"));
      }
    } catch (traceError) {
      console.log(
        chalk.yellow(
          `⚠️ Não foi possível remover o arquivo trace: ${traceError.message}`,
        ),
      );
    }
  }
}

async function main() {
  // Definir variáveis de ambiente para desenvolvimento
  process.env.NODE_ENV = "development";
  process.env.JEST_DISABLE_WATCH = "true";
  process.env.CI = "false";

  console.log(
    chalk.blue("🚀 Iniciando ambiente de desenvolvimento isolado..."),
  );

  try {
    // 0. Limpar cache do Next.js para evitar problemas de permissão
    await cleanNextCache();

    // 1. Parar qualquer serviço anterior
    console.log(chalk.yellow("🛑 Parando serviços anteriores..."));
    try {
      await runCommand("npm", ["run", "services:down"]);
    } catch (error) {
      console.log(chalk.gray("Nenhum serviço anterior encontrado."));
    }

    // 2. Iniciar serviços do Docker
    console.log(chalk.blue("🐳 Iniciando serviços Docker..."));
    await runCommand("npm", ["run", "services:up"]);

    // 3. Aguardar banco de dados
    console.log(chalk.blue("⏳ Aguardando banco de dados..."));
    await runCommand("npm", ["run", "services:wait:database"]);

    // 4. Executar migrações
    console.log(chalk.blue("📊 Executando migrações..."));
    await runCommand("npm", ["run", "migrations:up"]);

    // 5. Iniciar Next.js em modo desenvolvimento
    console.log(chalk.green("🎯 Iniciando servidor de desenvolvimento..."));
    console.log(
      chalk.green("O servidor estará disponível em: http://localhost:3000"),
    );
    console.log(chalk.yellow("Para parar, pressione Ctrl+C"));

    const nextProcess = spawn("npx", ["next", "dev"], {
      stdio: "inherit",
      shell: true,
      env: {
        ...process.env,
        NODE_ENV: "development",
        JEST_DISABLE_WATCH: "true",
        FORCE_COLOR: "1",
      },
    });

    // Timeout para detectar se o Next.js não está iniciando
    const startupTimeout = setTimeout(() => {
      console.log(
        chalk.yellow("⚠️ Next.js parece estar demorando para iniciar..."),
      );
      console.log(
        chalk.yellow(
          "Isso pode indicar um problema com o cache ou permissões.",
        ),
      );
      console.log(chalk.yellow("Tentando reiniciar..."));

      nextProcess.kill("SIGTERM");

      setTimeout(() => {
        console.log(chalk.blue("🔄 Tentando iniciar novamente..."));
        const retryProcess = spawn("npx", ["next", "dev"], {
          stdio: "inherit",
          shell: true,
          env: {
            ...process.env,
            NODE_ENV: "development",
            JEST_DISABLE_WATCH: "true",
            FORCE_COLOR: "1",
          },
        });

        retryProcess.on("close", cleanup);
      }, 2000);
    }, 30000); // 30 segundos timeout

    // Limpar timeout se o processo iniciar corretamente
    nextProcess.on("spawn", () => {
      clearTimeout(startupTimeout);
    });

    // Função para limpeza
    const cleanup = async () => {
      clearTimeout(startupTimeout);
      console.log(chalk.yellow("\n🧹 Limpando ambiente..."));
      nextProcess.kill();

      try {
        await runCommand("npm", ["run", "services:stop"]);
        console.log(chalk.green("✅ Ambiente limpo com sucesso!"));
      } catch (error) {
        console.error(chalk.red("Erro na limpeza:", error.message));
      }

      process.exit(0);
    };

    // Interceptar sinais de interrupção
    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);

    // Aguardar o processo do Next.js
    nextProcess.on("close", cleanup);
  } catch (error) {
    console.error(chalk.red("❌ Erro:", error.message));
    process.exit(1);
  }
}

main();
