/**
 * Mocks para componentes de UI como toast, modals, etc.
 */

// Mock para o toast
export const toastMock = {
  success: jest.fn(),
  error: jest.fn(),
};

// Configurar mock para toast
export function setupToastMock() {
  // Mock da biblioteca Sonner que é usada nos componentes
  jest.mock("sonner", () => ({
    toast: toastMock,
    Toaster: () => null, // Mock para o componente Toaster se necessário
  }));

  return toastMock;
}

// Limpar mocks de UI
export function clearUIMocks() {
  if (toastMock.success.mockClear) {
    toastMock.success.mockClear();
    toastMock.error.mockClear();
  }
}
