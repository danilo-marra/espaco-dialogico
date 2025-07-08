const { Client } = require("pg");
const dotenv = require("dotenv");
const { ServiceError } = require("./errors.js");

// Load environment variables from .env.development
dotenv.config({ path: ".env.development" });

async function query(queryObject) {
  let client;
  try {
    client = await getNewClient();
    const result = await client.query(queryObject);
    return result;
  } catch (error) {
    const serviceErrorObject = new ServiceError({
      message: "Erro na conexão com o Banco ou na Query.",
      cause: error,
    });
    throw serviceErrorObject;
  } finally {
    await client?.end();
  }
}

async function getNewClient() {
  const client = new Client({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    ssl: getSSLValues(),
  });

  await client.connect();
  return client;
}

const database = {
  query,
  getNewClient,
};

module.exports = database;

function getSSLValues() {
  if (process.env.POSTGRES_CA) {
    return {
      ca: process.env.POSTGRES_CA,
    };
  }

  // Usar SSL para production e staging
  return process.env.NODE_ENV === "production" ||
    process.env.NODE_ENV === "staging"
    ? true
    : false;
}
