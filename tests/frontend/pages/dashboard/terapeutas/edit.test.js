import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { store } from "store/store";
import "@testing-library/jest-dom";
import { toast } from "sonner";
import { EditarTerapeutaModal } from "components/Terapeuta/EditarTerapeutaModal";
import { setupServer } from "msw/node";
import { rest } from "msw";

// Mock simples para o toast
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock para a função mutate
const mutateMock = jest.fn();

// Mock simplificado do MSW para interceptar as requisições de API
const server = setupServer(
  rest.put("/api/v1/terapeutas/:id", (req, res, ctx) => {
    console.log("MSW interceptou requisição PUT para /api/v1/terapeutas/:id");
    return res(
      ctx.status(200),
      ctx.json({
        id: "1234-5678-9012",
        nome: "João Silva Atualizado",
        foto: null,
        telefone: "(11) 99999-8888",
        email: "joao.atualizado@teste.com",
        endereco: "Rua Exemplo, 123",
        dt_entrada: "2025-01-15T03:00:00.000Z",
        chave_pix: "123456789",
        created_at: "2025-04-01T15:30:00.000Z",
        updated_at: new Date().toISOString(),
      }),
    );
  }),
);

describe("Editar Terapeuta", () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: "warn" });
  });

  afterEach(() => {
    server.resetHandlers();
    jest.clearAllMocks();
    mutateMock.mockClear();
  });

  afterAll(() => {
    server.close();
  });

  test("Deve editar um terapeuta com sucesso", async () => {
    const user = userEvent.setup();
    const mockTerapeuta = {
      id: "1234-5678-9012",
      nome: "João Silva",
      foto: null,
      telefone: "(11) 98765-4321",
      email: "joao.silva@teste.com",
      endereco: "Rua Exemplo, 123",
      dt_entrada: "2025-01-15T03:00:00.000Z",
      chave_pix: "123456789",
    };

    // Renderiza diretamente o componente de edição
    render(
      <Provider store={store}>
        <EditarTerapeutaModal
          terapeuta={mockTerapeuta}
          open={true}
          onClose={() => {}}
          onSuccess={mutateMock}
        />
      </Provider>,
    );

    // Modifica alguns campos
    const campoNome = screen.getByDisplayValue("João Silva");
    const campoTelefone = screen.getByDisplayValue("(11) 98765-4321");

    await user.clear(campoNome);
    await user.type(campoNome, "João Silva Atualizado");

    await user.clear(campoTelefone);
    await user.type(campoTelefone, "(11) 99999-8888");

    // Submete o formulário
    const botaoSalvar = screen.getByRole("button", { name: /salvar/i });
    await user.click(botaoSalvar);

    // Verifica se a API foi chamada e o toast exibido
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });

    // Verificar se o callback onSuccess (mutate) foi chamado
    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalled();
    });
  });
});
