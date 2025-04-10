// filepath: c:\www\espaco-dialogico\tests\mocks\jestSetup.js
/**
 * Setup file para Jest
 * Configura os mocks globais antes de cada teste
 */

// Mock do Sonner (toast)
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    // Adicionar outros métodos do toast conforme necessário
  },
  Toaster: () => null,
}));
