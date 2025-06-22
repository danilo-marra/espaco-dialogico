const { Pool } = require("pg");
const dotenv = require("dotenv");
const path = require("path");

const envFile = process.argv[2] || ".env.staging";
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

console.log("🔍 Testando conexão com Neon...");
console.log(`Host: ${process.env.POSTGRES_HOST}`);
console.log(`Port: ${process.env.POSTGRES_PORT}`);
console.log(`Database: ${process.env.POSTGRES_DB}`);
console.log(`User: ${process.env.POSTGRES_USER}`);

async function testConnection() {
  // Configurações diferentes para testar
  const configs = [
    {
      name: "Config 1 - SSL rejectUnauthorized: false",
      config: {
        host: process.env.POSTGRES_HOST,
        port: parseInt(process.env.POSTGRES_PORT) || 5432,
        user: process.env.POSTGRES_USER,
        database: process.env.POSTGRES_DB,
        password: process.env.POSTGRES_PASSWORD,
        ssl: {
          rejectUnauthorized: false,
        },
      },
    },
    {
      name: "Config 2 - SSL require",
      config: {
        host: process.env.POSTGRES_HOST,
        port: parseInt(process.env.POSTGRES_PORT) || 5432,
        user: process.env.POSTGRES_USER,
        database: process.env.POSTGRES_DB,
        password: process.env.POSTGRES_PASSWORD,
        ssl: { require: true, rejectUnauthorized: false },
      },
    },
    {
      name: "Config 3 - SSL true",
      config: {
        host: process.env.POSTGRES_HOST,
        port: parseInt(process.env.POSTGRES_PORT) || 5432,
        user: process.env.POSTGRES_USER,
        database: process.env.POSTGRES_DB,
        password: process.env.POSTGRES_PASSWORD,
        ssl: true,
      },
    },
    {
      name: "Config 4 - DATABASE_URL direta",
      config: {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false,
        },
      },
    },
  ];

  for (const { name, config } of configs) {
    console.log(`\n🧪 Testando ${name}...`);

    const pool = new Pool(config);

    try {
      const client = await pool.connect();
      console.log("✅ Conexão estabelecida com sucesso!");

      // Testar query simples
      const result = await client.query("SELECT version()");
      console.log(
        `📊 PostgreSQL Version: ${result.rows[0].version.substring(0, 50)}...`,
      );

      // Listar tabelas
      const tables = await client.query(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename;
      `);

      console.log(`🗂️ Tabelas encontradas: ${tables.rows.length}`);
      tables.rows.forEach((table) => console.log(`  - ${table.tablename}`));

      client.release();
      await pool.end();

      console.log(`✅ ${name} funcionou!`);
      return config; // Retorna a configuração que funcionou
    } catch (error) {
      console.log(`❌ ${name} falhou: ${error.message}`);
      try {
        await pool.end();
      } catch (e) {
        // Ignora erro ao fechar pool
      }
    }
  }

  throw new Error("Nenhuma configuração de conexão funcionou");
}

testConnection()
  .then((workingConfig) => {
    console.log("\n🎉 Conexão testada com sucesso!");
    console.log(
      "📝 Use esta configuração:",
      JSON.stringify(workingConfig, null, 2),
    );
  })
  .catch((error) => {
    console.error("\n❌ Erro em todas as tentativas:", error.message);
  });
