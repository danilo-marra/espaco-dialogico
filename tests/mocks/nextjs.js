/**
 * Mocks para componentes e funcionalidades do Next.js
 */

import React from "react";

// Mock para o componente Next/Image
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props) => {
    return <div data-testid="mock-next-image" {...props} role="img" />;
  },
}));

// Mock para Next/Head
jest.mock("next/head", () => {
  return {
    __esModule: true,
    default: ({ children }) => <>{children}</>,
  };
});

// Mock para Next/Router
jest.mock("next/router", () => ({
  useRouter: () => ({
    pathname: "/dashboard/terapeutas",
  }),
}));

// Função para configurar mocks com pathname customizado
export function setupNextRouterMock(pathname = "/dashboard/terapeutas") {
  jest.mock("next/router", () => ({
    useRouter: () => ({
      pathname,
    }),
  }));
}
