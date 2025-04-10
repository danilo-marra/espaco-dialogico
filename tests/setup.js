// Definir ambiente como teste
process.env.NODE_ENV = "test";

// Qualquer outro código de setup necessário para os testes

// Add polyfill for TextEncoder/TextDecoder for Node.js environment in Jest
if (typeof TextEncoder === "undefined") {
  const { TextEncoder, TextDecoder } = require("util");
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Add fetch polyfill for Node.js environment
import fetch from "node-fetch";
if (!global.fetch) {
  global.fetch = fetch;
}

// Silencia os warnings do React no ambiente de teste
const originalError = console.error;
console.error = (...args) => {
  if (/Warning.*not wrapped in act/.test(args[0])) {
    return;
  }
  originalError.call(console, ...args);
};

// Configuração para testes que usam userEvent
window.HTMLElement.prototype.scrollIntoView = jest.fn();
window.HTMLElement.prototype.releasePointerCapture = jest.fn();
window.HTMLElement.prototype.hasPointerCapture = jest.fn();

// Mocks para APIs de portal
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Carrega automaticamente os mocks básicos do Next.js
// que são necessários para a maioria dos testes
require("./mocks/nextjs");
