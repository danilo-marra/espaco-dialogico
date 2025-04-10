import { jest } from "@jest/globals";
import { mockTerapeuta } from "./dataMocks";

export function setupHookMocks() {
  jest.mock("hooks/useFetchTerapeutas", () => ({
    __esModule: true,
    useFetchTerapeutas: () => ({
      terapeutas: [mockTerapeuta],
      isLoading: false,
      isError: false,
      mutate: jest.fn(),
    }),
  }));
}
