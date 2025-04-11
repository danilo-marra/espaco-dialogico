const dotenv = require("dotenv");
dotenv.config({
  path: ".env.development",
});

// Definir variável de ambiente para controlar a verbosidade dos logs
process.env.TEST_VERBOSE = process.env.TEST_VERBOSE || "false";

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
  // Configurações para reduzir a verbosidade dos logs
  verbose: false,
  silent: process.env.TEST_VERBOSE !== "true",
});

module.exports = jestConfig;
