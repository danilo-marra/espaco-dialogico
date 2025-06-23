import { renderHook, act } from "@testing-library/react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import useAuth from "../../../hooks/useAuth";

// Mock para o next/router
jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}));

// Mock para sonner (toast)
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock para fetch
global.fetch = jest.fn();

describe("useAuth hook", () => {
  const mockUser = {
    id: 1,
    username: "testuser",
    email: "test@example.com",
    role: "terapeuta",
    name: "Test User",
  };

  const mockAdminUser = {
    id: 2,
    username: "admin",
    email: "admin@example.com",
    role: "admin",
    name: "Admin User",
  };

  // Mock router
  const mockRouter = {
    push: jest.fn(),
  };

  // Setup e cleanup
  beforeEach(() => {
    useRouter.mockReturnValue(mockRouter);

    // Limpar localStorage antes de cada teste
    localStorage.clear();

    // Resetar todos os mocks
    jest.clearAllMocks();
  });

  test("deve inicializar com usuário null e loading false", () => {
    // Espia o localStorage.getItem
    jest.spyOn(Storage.prototype, "getItem").mockReturnValue(null);

    const { result } = renderHook(() => useAuth());

    // O hook deve iniciar com loading false (ajustado para o comportamento real do hook)
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isAdmin).toBe(false);
  });

  test("deve carregar usuário do localStorage na inicialização", () => {
    // Mock que localStorage tem um usuário
    jest.spyOn(Storage.prototype, "getItem").mockImplementation((key) => {
      if (key === "user") {
        return JSON.stringify(mockUser);
      }
      return null;
    });

    const { result } = renderHook(() => useAuth());

    // Espera que o useEffect seja executado
    act(() => {
      // Simula a conclusão do useEffect
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  test("deve identificar corretamente um administrador", () => {
    // Mock que localStorage tem um usuário admin
    jest.spyOn(Storage.prototype, "getItem").mockImplementation((key) => {
      if (key === "user") {
        return JSON.stringify(mockAdminUser);
      }
      return null;
    });

    const { result } = renderHook(() => useAuth());

    // Espera que o useEffect seja executado
    act(() => {
      // Simula a conclusão do useEffect
    });

    expect(result.current.isAdmin).toBe(true);
  });

  test("deve fazer login com sucesso", async () => {
    // Mock para o fetch retornar resposta bem-sucedida
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        token: "fake-token",
        user: mockUser,
      }),
    });

    // Espia o localStorage.setItem
    const setItemSpy = jest.spyOn(Storage.prototype, "setItem");

    const { result } = renderHook(() => useAuth());

    // Executa o login
    await act(async () => {
      await result.current.login("test@example.com", "password123");
    });

    // Verifica se fetch foi chamado corretamente
    expect(global.fetch).toHaveBeenCalledWith("/api/v1/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
      }),
    });

    // Verifica se localStorage foi atualizado
    expect(setItemSpy).toHaveBeenCalledWith("authToken", "fake-token");
    expect(setItemSpy).toHaveBeenCalledWith("user", JSON.stringify(mockUser));

    // Verifica se o estado foi atualizado
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.loading).toBe(false);

    // Verifica se o toast e redirecionamento foram chamados
    expect(toast.success).toHaveBeenCalledWith("Login realizado com sucesso!");
    expect(mockRouter.push).toHaveBeenCalledWith("/dashboard");
  });

  test("deve lidar com erro de login", async () => {
    // Mock para o fetch retornar erro
    const errorMessage = "Credenciais inválidas";
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: errorMessage,
      }),
    });

    // Garante que não há usuário no localStorage
    jest.spyOn(Storage.prototype, "getItem").mockReturnValue(null);

    const { result } = renderHook(() => useAuth());

    // Garante que o estado inicial é sem usuário
    expect(result.current.user).toBeNull();

    // Tenta fazer login - deve lançar erro
    await act(async () => {
      try {
        await result.current.login("wrong@example.com", "wrongpass");
        // Se chegar aqui, o teste falhou
        fail("O login deveria ter falhado");
      } catch (error) {
        // O erro é esperado
        expect(error.message).toBe(errorMessage);
      }
    });

    // Verifica se o toast de erro foi chamado
    expect(toast.error).toHaveBeenCalledWith(errorMessage);

    // Verifica que o usuário continua não autenticado
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  test("deve fazer logout corretamente", () => {
    // Configura um usuário inicialmente logado
    jest.spyOn(Storage.prototype, "getItem").mockImplementation((key) => {
      if (key === "user") {
        return JSON.stringify(mockUser);
      }
      return null;
    });

    // Espia o localStorage.removeItem
    const removeItemSpy = jest.spyOn(Storage.prototype, "removeItem");

    const { result } = renderHook(() => useAuth());

    // Espera que o useEffect seja executado para carregar o usuário
    act(() => {
      // Simula a conclusão do useEffect
    });

    // Verifica que tem um usuário logado
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);

    // Executa o logout
    act(() => {
      result.current.logout();
    });

    // Verifica se localStorage foi limpo
    expect(removeItemSpy).toHaveBeenCalledWith("authToken");
    expect(removeItemSpy).toHaveBeenCalledWith("user");

    // Verifica se o estado foi atualizado
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);

    // Verifica se o redirecionamento foi chamado
    expect(mockRouter.push).toHaveBeenCalledWith("/login");
  });

  test("deve lidar com erro no JSON ao carregar usuário do localStorage", () => {
    // Mock que localStorage tem um JSON inválido
    jest.spyOn(Storage.prototype, "getItem").mockReturnValue("invalid-json");

    // Espia o console.error
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    const { result } = renderHook(() => useAuth());

    // Espera que o useEffect seja executado
    act(() => {
      // Simula a conclusão do useEffect
    });

    // Verifica que houve um erro
    expect(consoleErrorSpy).toHaveBeenCalled();

    // Verifica que o usuário continua não autenticado
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  test("deve lidar com erro de rede durante login", async () => {
    // Mock para o fetch lançar erro de rede
    global.fetch.mockRejectedValueOnce(new Error("Erro de conexão"));

    const { result } = renderHook(() => useAuth());

    // Tenta fazer login - deve lançar erro
    await act(async () => {
      try {
        await result.current.login("test@example.com", "password123");
        // Se chegar aqui, o teste falhou
        fail("O login deveria ter falhado");
      } catch (error) {
        // O erro é esperado
        expect(error.message).toBe("Erro de conexão");
      }
    });

    // Verifica se o toast de erro foi chamado
    expect(toast.error).toHaveBeenCalledWith("Erro de conexão");

    // Verifica que o usuário continua não autenticado
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
