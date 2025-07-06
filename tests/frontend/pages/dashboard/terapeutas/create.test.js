test.js;
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { rest } from "msw";
import { setupServer } from "msw/node";
import { Provider } from "react-redux";
import { store } from "store/store";
import Terapeutas from "pages/dashboard/terapeutas";
import "@testing-library/jest-dom";
import { toast } from "sonner";

// Mocks necessários (igual ao get.test.js)
jest.mock("hooks/useFetchTerapeutas", () => ({
  __esModule: true,
  useFetchTerapeutas: () => ({
    terapeutas: [
      {
        id: "1234-5678-9012",
        nome: "João Silva",
        foto: null,
        telefone: "(11) 98765-4321",
        email: "joao.silva@teste.com",
        crp: "CRP 06/12345",
        dt_nascimento: "1985-03-15",
        curriculo_arquivo: null,
        dt_entrada: "2025-01-15T03:00:00.000Z",
        chave_pix: "123456789",
        user_id: null,
        created_at: "2025-04-01T15:30:00.000Z",
        updated_at: "2025-04-01T15:30:00.000Z",
      },
    ],
    isLoading: false,
    isError: false,
    mutate: jest.fn(),
  }),
}));

// Mock de Next.js
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
    // Ensure the mock has an alt prop for accessibility
    return <div data-testid="mock-next-image" {...props} role="img" />;
  },
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Configuração do servidor MSW
const server = setupServer(
  rest.post("http://localhost:3000/api/v1/terapeutas", (req, res, ctx) => {
    console.log("MSW interceptou requisição POST para /api/v1/terapeutas");
    return res(
      ctx.status(201),
      ctx.json({
        id: "novo-uuid-gerado",
        nome: "Maria Silva",
        telefone: "(21) 98765-4321",
        email: "maria.silva@teste.com",
        crp: null,
        dt_nascimento: null,
        curriculo_arquivo: null,
        dt_entrada: "2025-04-10T03:00:00.000Z",
        chave_pix: "maria123",
        foto: null,
        user_id: null,
        created_at: "2025-04-10T15:30:00.000Z",
        updated_at: "2025-04-10T15:30:00.000Z",
      }),
    );
  }),
);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  jest.clearAllMocks();
});
afterAll(() => server.close());

describe("Criar Novo Terapeuta", () => {
  test("Deve abrir o modal e criar um novo terapeuta com sucesso", async () => {
    const user = userEvent.setup();

    // Renderiza o componente
    render(
      <Provider store={store}>
        <Terapeutas />
      </Provider>,
    );

    // 1. Encontra e clica no botão "Novo Terapeuta"
    const botaoNovoTerapeuta = await screen.findByText("Novo Terapeuta");
    await user.click(botaoNovoTerapeuta);

    // 2. Verifica se o modal abriu
    expect(await screen.findByText("Dados do Terapeuta")).toBeInTheDocument();

    // 3. Preenche os campos do formulário
    await user.type(
      screen.getByPlaceholderText("Nome do terapeuta"),
      "Maria Silva",
    );
    await user.type(
      screen.getByPlaceholderText("Telefone do terapeuta"),
      "(21) 98765-4321",
    );
    await user.type(
      screen.getByPlaceholderText("Email do terapeuta"),
      "maria.silva@teste.com",
    );
    await user.type(screen.getByPlaceholderText("Chave PIX"), "maria123");

    // 4. Data de entrada (pode ser mais complexo dependendo de seu componente de data)
    // Simulação simplificada:
    const dateInput = screen.getByPlaceholderText(
      "Data de entrada (dd/MM/yyyy)",
    );
    await user.type(dateInput, "10/04/2025");

    // 5. Submete o formulário
    const botaoSalvar = screen.getByText("Confirmar");
    await user.click(botaoSalvar);
  });
});
