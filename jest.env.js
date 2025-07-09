const dotenv = require("dotenv");
const path = require("path");

// Forçar o carregamento do .env.test durante os testes Jest
dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });
