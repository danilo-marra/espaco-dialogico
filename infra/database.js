const { Pool } = require("pg");
const { ServiceError } = require("./errors.js");

let pool;
let poolKey;

async function query(queryObject) {
  try {
    const result = await getPool().query(queryObject);
    return result;
  } catch (error) {
    const serviceErrorObject = new ServiceError({
      message: "Erro na conexão com o Banco ou na Query.",
      cause: error,
    });
    throw serviceErrorObject;
  }
}

async function getNewClient() {
  const client = await getPool().connect();
  return createPooledClient(client);
}

async function transaction(callback) {
  const client = await getNewClient();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

async function shutdown() {
  if (pool) {
    await pool.end();
    pool = undefined;
    poolKey = undefined;
  }
}

function getPool() {
  const config = withPoolOptions(getConnectionConfig());
  const nextPoolKey = JSON.stringify(config);

  if (!pool || poolKey !== nextPoolKey) {
    pool = new Pool(config);
    poolKey = nextPoolKey;
  }

  return pool;
}

function withPoolOptions(config) {
  if (process.env.NODE_ENV !== "test") {
    return config;
  }

  return {
    ...config,
    idleTimeoutMillis: 100,
  };
}

function createPooledClient(client) {
  let released = false;

  return {
    query: (...args) => client.query(...args),
    end: () => {
      if (!released) {
        released = true;
        client.release();
      }
    },
  };
}

function getConnectionConfig() {
  const ssl = getSSLValues();
  const rawUrl = process.env.DATABASE_URL;
  const hasConnStr = !!rawUrl && rawUrl.trim().length > 0;

  if (hasConnStr) {
    // Expansão manual de placeholders estilo $VAR (dotenv sem expand)
    let expandedUrl = rawUrl;
    if (/\$[A-Z0-9_]+/i.test(rawUrl)) {
      expandedUrl = rawUrl.replace(/\$([A-Z0-9_]+)/gi, (_, varName) => {
        const value = process.env[varName];
        if (value === undefined) {
          throw new Error(
            `Placeholder $${varName} encontrado em DATABASE_URL mas variável não está definida.`,
          );
        }
        return value; // Não aplicamos encodeURIComponent para não alterar formatação caso já esteja válida
      });
      if (process.env.DEBUG_DB === "true") {
        console.log(
          `🧪 DATABASE_URL após expansão: ${expandedUrl.replace(/:[^:@/]*@/, ":***@")}`,
        );
      }
    }

    // Validação do formato básico da URL
    try {
      const parsed = new URL(expandedUrl);
      if (!/^postgres(ql)?:$/.test(parsed.protocol)) {
        throw new Error(
          `Protocolo inválido na DATABASE_URL: ${parsed.protocol} (esperado postgres:// ou postgresql://)`,
        );
      }
      // Mascarar credenciais para log
      const masked = expandedUrl.replace(/:[^:@/]*@/, ":***@");
      if (process.env.DEBUG_DB === "true") {
        console.log(`🔐 Usando DATABASE_URL: ${masked}`);
      }
      return { connectionString: expandedUrl, ssl };
    } catch (e) {
      console.warn(
        `⚠️ DATABASE_URL inválida ou não parseável (${e.message}). Tentando fallback para variáveis separadas...`,
      );
    }
  }

  // Fallback: validar variáveis individuais
  const requiredVars = [
    "POSTGRES_HOST",
    "POSTGRES_PORT",
    "POSTGRES_USER",
    "POSTGRES_DB",
    "POSTGRES_PASSWORD",
  ];
  const missing = requiredVars.filter((v) => !process.env[v]);
  if (missing.length) {
    throw new Error(
      `Variáveis de ambiente faltando para conexão Postgres: ${missing.join(", ")}. ` +
        `Defina DATABASE_URL válida ou todas as variáveis individuais.`,
    );
  }

  const config = {
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT),
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    ssl,
  };
  if (process.env.DEBUG_DB === "true") {
    console.log(
      `🔌 Conectando via parâmetros separados: ${process.env.POSTGRES_USER}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`,
    );
  }
  return config;
}

const database = {
  query,
  getNewClient,
  transaction,
  shutdown,
};

module.exports = database;

function getSSLValues() {
  if (process.env.POSTGRES_CA) {
    return {
      ca: process.env.POSTGRES_CA,
      rejectUnauthorized: false,
    };
  }

  // Usar SSL para production e staging
  return process.env.NODE_ENV === "production" ||
    process.env.NODE_ENV === "staging"
    ? { rejectUnauthorized: false }
    : false;
}
