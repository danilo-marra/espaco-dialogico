const { exec } = require("child_process");

console.log("Executando migrações automaticamente...");

// Determinar qual arquivo .env usar baseado no ambiente
const envPath =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : process.env.NODE_ENV === "staging"
      ? ".env.staging"
      : ".env.development.local";

console.log(`Usando arquivo de ambiente: ${envPath}`);

// Execute o comando node-pg-migrate com as opções apropriadas
exec(
  `npx node-pg-migrate -m infra/migrations --envPath ${envPath} up`,
  (error, stdout, stderr) => {
    if (error) {
      console.error(`Erro ao executar migrações: ${error.message}`);
      return;
    }

    if (stderr) {
      console.error(`Erro nas migrações: ${stderr}`);
      return;
    }

    console.log(`Migrações executadas com sucesso: ${stdout}`);
  },
);
