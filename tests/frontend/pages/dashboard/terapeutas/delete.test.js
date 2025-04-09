import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { rest } from "msw";
import { setupServer } from "msw/node";
import { Provider } from "react-redux";
import { store } from "store/store";
import Terapeutas from "pages/dashboard/terapeutas";
import "@testing-library/jest-dom";

// Mock do terapeuta para exclusão
const terapeutaToDelete = {
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

// Criação de um mock explícito para mutate que podemos verificar
const mutateMock = jest.fn();

// Mocks necessários
jest.mock("hooks/useFetchTerapeutas", () => ({
  __esModule: true,
  useFetchTerapeutas: () => ({
    terapeutas: [terapeutaToDelete],
    isLoading: false,
    isError: false,
    mutate: mutateMock, // Use a variável mutateMock em vez de jest.fn() inline
  }),
}));

// Mock do toast
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Outros mocks
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

// Servidor MSW - Usando RegExp para capturar qualquer URL que termine com o ID
const server = setupServer(
  rest.delete(
    new RegExp(`.*?/terapeutas/${terapeutaToDelete.id}$`),
    (req, res, ctx) => {
      console.log("MSW interceptou requisição DELETE para /terapeutas/:id");
      return res(ctx.status(204));
    },
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => {
  server.resetHandlers();
  jest.clearAllMocks(); // Limpa todos os mocks entre os testes
  mutateMock.mockClear(); // Limpa explicitamente o mock de mutate
});
afterAll(() => server.close());

// Importação explícita para poder verificar os mocks após os testes
import { toast } from "sonner";

describe("Excluir Terapeuta", () => {
  test("Deve abrir o modal de confirmação e excluir o terapeuta com sucesso", async () => {
    const user = userEvent.setup();

    // Renderiza o componente
    render(
      <Provider store={store}>
        <Terapeutas />
      </Provider>,
    );

    // 1. Encontra e clica no botão de exclusão
    const botaoExcluir = await screen.findByTitle("Excluir Terapeuta");
    await user.click(botaoExcluir);

    // 2. Verifica se o modal de confirmação aparece
    const modal = await screen.findByRole("dialog");
    expect(modal).toBeInTheDocument();

    // Verifica conteúdo do modal
    expect(
      screen.getByText(
        new RegExp(
          `Tem certeza que deseja excluir o terapeuta ${terapeutaToDelete.nome}`,
          "i",
        ),
      ),
    ).toBeInTheDocument();

    // 3. Confirma a exclusão
    const botaoConfirmar = screen.getByRole("button", { name: /excluir/i });
    await user.click(botaoConfirmar);

    // 4. Verifica se o toast de sucesso foi chamado
    await waitFor(
      () => {
        expect(toast.success).toHaveBeenCalledWith(
          `Terapeuta ${terapeutaToDelete.nome} excluído com sucesso.`,
        );
      },
      { timeout: 5000 },
    );

    // 5. Verificar se o mutate foi chamado para atualizar a lista
    await waitFor(
      () => {
        expect(mutateMock).toHaveBeenCalledTimes(1);
      },
      { timeout: 5000 },
    );
  });
});
