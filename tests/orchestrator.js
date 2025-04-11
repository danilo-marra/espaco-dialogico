import retry from "async-retry";
import database from "infra/database.js";
import migrator from "models/migrator.js";

// Importar node-fetch para ambientes onde fetch não está disponível nativamente
import fetch from "node-fetch";

// Controle para logs verbosos (pode ser controlado por uma variável de ambiente)
const VERBOSE = process.env.TEST_VERBOSE === "true";

// Função auxiliar para log condicional
function conditionalLog(message) {
  if (VERBOSE) {
    console.log(message);
  }
}

async function waitForAllServices() {
  conditionalLog("🔄 Aguardando todos os serviços ficarem disponíveis...");
  try {
    await waitForWebServer();
    conditionalLog("✅ Todos os serviços estão prontos!");
  } catch (error) {
    console.error(`❌ Falha ao aguardar os serviços: ${error.message}`);
    throw error;
  }

  async function waitForWebServer() {
    const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT || 3000;
    conditionalLog(`🔍 Verificando servidor web na porta ${port}...`);

    return retry(fetchStatusPage, {
      retries: 50,
      minTimeout: 500,
      maxTimeout: 3000,
      factor: 1.5,
      onRetry: (error, attempt) => {
        conditionalLog(
          `⏱️ Tentativa ${attempt}: Aguardando servidor na porta ${port}... (${error.message})`,
        );
      },
    });

    async function fetchStatusPage() {
      const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT || 3000;
      // Garantir que a URL está correta - usar uma constante para evitar typos
      const hostname = "localhost";
      const url = `http://${hostname}:${port}/api/v1/status`;

      conditionalLog(`🔄 Tentando conectar a ${url}`);

      let response;
      try {
        // Remover a opção timeout que pode não ser suportada em algumas implementações de fetch
        response = await fetch(url);
      } catch (error) {
        throw new Error(`Erro na conexão com ${url}: ${error.message}`);
      }

      if (response.status !== 200) {
        throw new Error(
          `Falha na conexão com ${url}, status: ${response.status}`,
        );
      }

      conditionalLog(
        `✅ Conectado com sucesso ao servidor web na porta ${port}`,
      );
    }
  }
}

async function clearDatabase() {
  conditionalLog("🗑️ Limpando banco de dados...");
  try {
    await database.query("drop schema public cascade; create schema public;");
    conditionalLog("✅ Banco de dados limpo com sucesso");
  } catch (error) {
    console.error(`❌ Erro ao limpar banco de dados: ${error.message}`);
    throw error;
  }
}

async function runPendingMigrations() {
  conditionalLog("🔄 Executando migrações pendentes...");
  try {
    // Substituir o console.log padrão temporariamente para suprimir logs das migrações
    const originalConsoleLog = console.log;

    // Se não estiver em modo verbose, silencia os logs padrão das migrações
    if (!VERBOSE) {
      console.log = function () {};
    }

    await migrator.runPendingMigrations();

    // Restaurar o console.log original
    console.log = originalConsoleLog;

    conditionalLog("✅ Migrações aplicadas com sucesso");
  } catch (error) {
    console.error(`❌ Erro ao aplicar migrações: ${error.message}`);
    throw error;
  }
}

const orchestrator = {
  waitForAllServices,
  clearDatabase,
  runPendingMigrations,
};

export default orchestrator;
