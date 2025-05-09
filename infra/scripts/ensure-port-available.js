const { execSync } = require("child_process");
const chalk = require("chalk");

function ensurePortAvailable(port) {
  console.log(
    chalk.blue(`🔍 Verificando se a porta ${port} está disponível...`),
  );

  try {
    // Verificar se a porta está em uso
    const output = execSync(`netstat -ano | findstr :${port}`, {
      encoding: "utf8",
    });

    if (output) {
      // Extrair PID do processo usando a porta
      const pidMatch = output.match(/LISTENING\s+(\d+)/);
      if (pidMatch && pidMatch[1]) {
        const pid = pidMatch[1];
        console.log(
          chalk.yellow(
            `⚠️ Porta ${port} em uso pelo processo ${pid}. Encerrando...`,
          ),
        );

        try {
          execSync(`taskkill /F /PID ${pid}`);
          console.log(
            chalk.green(
              `✅ Processo ${pid} encerrado. Porta ${port} liberada.`,
            ),
          );
        } catch (error) {
          console.error(
            chalk.red(`❌ Falha ao encerrar processo: ${error.message}`),
          );
          process.exit(1);
        }
      }
    }
  } catch (error) {
    // Se o comando não encontrar nenhum processo, a porta está disponível
    console.log(chalk.green(`✅ Porta ${port} disponível.`));
  }
}

ensurePortAvailable(3000);
