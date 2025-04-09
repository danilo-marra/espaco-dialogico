import { jest } from "@jest/globals";
import React from "react";

export function setupNextMocks() {
  jest.mock("next/router", () => ({
    useRouter: () => ({
      pathname: "/dashboard/terapeutas",
    }),
  }));

  jest.mock("next/head", () => {
    return {
      __esModule: true,
      default: ({ children }) => <>{children}</>,
    };
  });

  jest.mock("next/image", () => ({
    __esModule: true,
    default: (props) => {
      return <div data-testid="mock-next-image" {...props} role="img" />;
    },
  }));

  jest.mock("sonner", () => ({
    toast: {
      success: jest.fn(),
      error: jest.fn(),
    },
  }));
}
