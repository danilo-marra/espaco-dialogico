import retry from "async-retry";
import database from "infra/database.js";

async function waitForAllServices() {
  await waitForWebServer();
  await waitForTerapeutasEndpoint();
}

async function waitForWebServer() {
  return retry(fetchStatusPage, {
    retries: 100,
    maxTimeout: 1000,
  });

  async function fetchStatusPage() {
    const response = await fetch("http://localhost:3000/api/v1/status");

    if (response.status !== 200) {
      throw Error("Status endpoint not ready");
    }
  }
}

async function waitForTerapeutasEndpoint() {
  return retry(fetchTerapeutasPage, {
    retries: 100,
    maxTimeout: 1000,
  });

  async function fetchTerapeutasPage() {
    const response = await fetch("http://localhost:3000/api/v1/terapeutas");

    if (response.status !== 200) {
      throw Error("Terapeutas endpoint not ready");
    }
  }
}

async function clearDatabase() {
  await database.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
}

const orchestrator = {
  waitForAllServices,
  clearDatabase,
};

export default orchestrator;
