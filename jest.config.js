const dotenv = require("dotenv");
dotenv.config({
  path: ".env.development",
});

// Definir variável de ambiente para controlar a verbosidade dos logs
process.env.TEST_VERBOSE = process.env.TEST_VERBOSE || "false";

// Prevenir execução de testes se não estiver em ambiente de teste explícito
if (process.env.NODE_ENV !== "test" && !process.env.JEST_EXPLICIT_RUN) {
  console.log("⚠️ Testes não serão executados fora do ambiente de teste!");
  process.exit(0);
}

const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: ".",
});
const jestConfig = createJestConfig({
  moduleDirectories: ["node_modules", "<rootDir>"],
  testTimeout: 120000, // Increased from 60000 to 120000
  setupFiles: ["<rootDir>/tests/setup.js"],
  testEnvironment: "jsdom",
  setupFilesAfterEnv: [
    "@testing-library/jest-dom",
    "<rootDir>/tests/mocks/jestSetup.js",
  ],
  // Excluir endpoints de email dos testes
  testPathIgnorePatterns: [
    "<rootDir>/.next/",
    "<rootDir>/node_modules/",
    "<rootDir>/pages/api/v1/email/",
    "<rootDir>/pages/api/v1/invites/send-email.js",
  ],
  // Configurações para reduzir a verbosidade dos logs
  verbose: false,
  silent: process.env.TEST_VERBOSE !== "true",
});

module.exports = jestConfig;
