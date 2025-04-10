export * from "./dataMocks";
export * from "./nextMocks";
export * from "./hookMocks";
export * from "./serverMocks";

import { jest } from "@jest/globals";
import { setupNextMocks } from "./nextMocks";
import { setupHookMocks } from "./hookMocks";
import { server, setupFetchMock } from "./serverMocks";

// Configuração completa de mocks
export function setupAllMocks() {
  setupNextMocks();
  setupHookMocks();
  setupFetchMock();

  // Configurar MSW
  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterEach(() => {
    server.resetHandlers();
    jest.clearAllMocks();
  });
  afterAll(() => server.close());
}
