/**
 * Arquivo central para importar e configurar todos os mocks
 */

import { setupToastMock, clearUIMocks } from "./ui";
import { setupUseFetchTerapeutasMock, mutateMock } from "./hooks";
import { createMockServer, setupStatusApiMock } from "./api";

export function setupTestMocks(options = {}) {
  const { setupToast = true, setupHooks = true, setupApi = true } = options;

  const mocks = {};

  if (setupToast) {
    mocks.toast = setupToastMock();
  }

  if (setupHooks) {
    mocks.hooks = setupUseFetchTerapeutasMock();
  }

  if (setupApi) {
    const { server, addTerapeutaHandlers } = createMockServer();
    mocks.server = server;
    mocks.apiHandlers = addTerapeutaHandlers();
    mocks.statusApi = setupStatusApiMock();
  }

  return mocks;
}

export function clearAllMocks() {
  jest.clearAllMocks();
  clearUIMocks();
  mutateMock.mockClear();
}

// Re-export para facilitar imports
export * from "./ui";
export * from "./hooks";
export * from "./api";
export * from "./nextjs";
