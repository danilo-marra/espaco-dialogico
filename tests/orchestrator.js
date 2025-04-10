import retry from "async-retry";
import database from "infra/database.js";
import migrator from "models/migrator.js";

// Importar node-fetch para ambientes onde fetch não está disponível nativamente
import fetch from "node-fetch";

async function waitForAllServices() {
  console.log("🔄 Aguardando todos os serviços ficarem disponíveis...");
  try {
    await waitForWebServer();
    console.log("✅ Todos os serviços estão prontos!");
  } catch (error) {
    console.error(`❌ Falha ao aguardar os serviços: ${error.message}`);
    throw error;
  }

  async function waitForWebServer() {
    const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT || 3000;
    console.log(`🔍 Verificando servidor web na porta ${port}...`);

    return retry(fetchStatusPage, {
      retries: 50,
      minTimeout: 500,
      maxTimeout: 3000,
      factor: 1.5,
      onRetry: (error, attempt) => {
        console.log(
          `⏱️ Tentativa ${attempt}: Aguardando servidor na porta ${port}... (${error.message})`,
        );
      },
    });

    async function fetchStatusPage() {
      const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT || 3000;
      // Garantir que a URL está correta - usar uma constante para evitar typos
      const hostname = "localhost";
      const url = `http://${hostname}:${port}/api/v1/status`;

      console.log(`🔄 Tentando conectar a ${url}`);

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

      console.log(`✅ Conectado com sucesso ao servidor web na porta ${port}`);
    }
  }
}

async function clearDatabase() {
  console.log("🗑️ Limpando banco de dados...");
  try {
    await database.query("drop schema public cascade; create schema public;");
    console.log("✅ Banco de dados limpo com sucesso");
  } catch (error) {
    console.error(`❌ Erro ao limpar banco de dados: ${error.message}`);
    throw error;
  }
}

async function runPendingMigrations() {
  console.log("🔄 Executando migrações pendentes...");
  try {
    await migrator.runPendingMigrations();
    console.log("✅ Migrações aplicadas com sucesso");
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
