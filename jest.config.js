const dotenv = require("dotenv");

// Para execução direta (jest --watch / arquivo único) garantir carregamento .env.test
if (process.env.NODE_ENV !== "test") {
  process.env.NODE_ENV = "test";
}
dotenv.config({ path: ".env.test" });
process.env.TEST_VERBOSE = process.env.TEST_VERBOSE || "false";

const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: ".",
});
const jestConfig = createJestConfig({
  moduleDirectories: ["node_modules", "<rootDir>"],
  testTimeout: 120000, // Increased from 60000 to 120000
  setupFiles: ["<rootDir>/tests/setup.js", "<rootDir>/jest.env.js"],
  globalSetup: "<rootDir>/tests/global-setup.js",
  globalTeardown: "<rootDir>/tests/global-teardown.js",
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
