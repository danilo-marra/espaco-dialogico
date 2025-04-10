/**
 * Mocks para hooks customizados da aplicação
 */

// Mock padrão para useFetchTerapeutas
export const mockTerapeuta = {
  id: "1234-5678-9012",
  nome: "João Silva",
  foto: null,
  telefone: "(11) 98765-4321",
  email: "joao.silva@teste.com",
  endereco: "Rua Exemplo, 123",
  dt_entrada: "2025-01-15T03:00:00.000Z",
  chave_pix: "123456789",
  created_at: "2025-04-01T15:30:00.000Z",
  updated_at: "2025-04-01T15:30:00.000Z",
};

// Mock function para mutate que pode ser spyOn
export const mutateMock = jest.fn();

// Configurar mock para useFetchTerapeutas
export function setupUseFetchTerapeutasMock(
  customTerapeutas = [mockTerapeuta],
  isLoading = false,
  isError = false,
  mutateFn = mutateMock,
) {
  jest.mock("hooks/useFetchTerapeutas", () => ({
    __esModule: true,
    useFetchTerapeutas: () => ({
      terapeutas: customTerapeutas,
      isLoading,
      isError,
      mutate: mutateFn,
    }),
  }));

  return {
    terapeutas: customTerapeutas,
    mutate: mutateFn,
  };
}
