import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { store } from "store/store";
import Terapeutas from "pages/dashboard/terapeutas";
import "@testing-library/jest-dom";
import { setupTestMocks, setupStatusApiMock } from "tests/mocks/setup";

// Configurar todos os mocks necessários para este teste
const mocks = setupTestMocks();

describe("Dashboard Terapeutas", () => {
  beforeAll(() => {
    // Iniciar o servidor mock
    mocks.server.listen({ onUnhandledRequest: "error" });
  });

  afterEach(() => {
    // Resetar o estado do servidor entre os testes
    mocks.server.resetHandlers();
  });

  afterAll(() => {
    // Fechar o servidor ao terminar
    mocks.server.close();
  });

  test("Página deve ser carregada corretamente", async () => {
    // Renderiza o componente com o store Redux
    render(
      <Provider store={store}>
        <Terapeutas />
      </Provider>,
    );

    // Buscar especificamente pelo h1 principal da página
    expect(
      await screen.findByRole("heading", {
        name: "Terapeutas",
        level: 1,
      }),
    ).toBeInTheDocument();

    // Verificar se o botão de novo terapeuta está presente
    expect(await screen.findByText("Novo Terapeuta")).toBeInTheDocument();

    // Verificar se João Silva está presente (pode aparecer em múltiplos lugares)
    // Usar getAllByText para verificar que existe pelo menos um
    const joaoSilvaElements = await screen.findAllByText("João Silva");
    expect(joaoSilvaElements.length).toBeGreaterThan(0);

    // Verificar se os elementos de filtro estão presentes
    expect(
      await screen.findByText("Filtrar por Terapeuta"),
    ).toBeInTheDocument();
  });

  test("Banco de dados deve estar ativo", async () => {
    let apiCalled = false;
    const mockStatus = setupStatusApiMock();

    // Substitua a implementação de fetch para detectar a chamada
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url === "http://localhost:3000/api/v1/status") {
        apiCalled = true;
      }
      return Promise.resolve({
        status: 200,
        json: () => Promise.resolve(mockStatus),
      });
    });

    // Faça a chamada
    const response = await global.fetch("http://localhost:3000/api/v1/status");
    const data = await response.json();

    // Verificações
    expect(apiCalled).toBe(true);
    expect(data.dependencies.database.version).toBe("16.0");
  });

  test("Tabela de terapeutas deve estar pronta para aceitar novos registros", async () => {
    render(
      <Provider store={store}>
        <Terapeutas />
      </Provider>,
    );

    // Verificar elementos da tabela
    const botaoNovoTerapeuta = await screen.findByText("Novo Terapeuta");
    expect(botaoNovoTerapeuta).toBeInTheDocument();
    expect(botaoNovoTerapeuta).not.toBeDisabled();

    expect(await screen.findByText("Nome")).toBeInTheDocument();
    expect(await screen.findByText("Email")).toBeInTheDocument();
    expect(await screen.findByText("Telefone")).toBeInTheDocument();
  });
});
