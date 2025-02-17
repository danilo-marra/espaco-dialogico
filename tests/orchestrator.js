import retry from "async-retry";
import database from "infra/database.js";

async function waitForAllServices() {
  await waitForWebServer();
  await waitForDatabase();
  await waitForTerapeutas();

  async function waitForWebServer() {
    return retry(fetchStatusPage, {
      retries: 100,
      maxTimeout: 1000,
    });

    async function fetchStatusPage() {
      const response = await fetch("http://localhost:3000/api/v1/status");
      if (response.status !== 200) {
        throw Error();
      }
    }
  }

  async function waitForDatabase() {
    return retry(checkDatabaseConnection, {
      retries: 100,
      maxTimeout: 1000,
    });

    async function checkDatabaseConnection() {
      try {
        const client = await database.getNewClient();
        await client.end();
      } catch (error) {
        throw Error();
      }
    }
  }

  async function waitForTerapeutas() {
    return retry(fetchTerapeutasStatus, {
      retries: 100,
      maxTimeout: 1000,
    });

    async function fetchTerapeutasStatus() {
      const response = await fetch("http://localhost:3000/api/v1/terapeutas");
      if (response.status !== 200) {
        throw new Error("Endpoint /api/v1/terapeutas não retornou status 200");
      }
    }
  }
}

async function clearDatabase() {
  await database.query("drop schema public cascade; create schema public;");
}

const orchestrator = {
  waitForAllServices,
  clearDatabase,
};

export default orchestrator;
