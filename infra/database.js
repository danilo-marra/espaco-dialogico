const { Client } = require("pg");
const { ServiceError } = require("./errors.js");

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
      const client = new Client({ connectionString: expandedUrl, ssl });
      await client.connect();
      return client;
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

  const client = new Client({
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT),
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    ssl,
  });
  if (process.env.DEBUG_DB === "true") {
    console.log(
      `🔌 Conectando via parâmetros separados: ${process.env.POSTGRES_USER}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`,
    );
  }
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
      rejectUnauthorized: false,
    };
  }

  // Usar SSL para production e staging
  return process.env.NODE_ENV === "production" ||
    process.env.NODE_ENV === "staging"
    ? { rejectUnauthorized: false }
    : false;
}
