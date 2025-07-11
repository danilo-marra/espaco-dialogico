/**
 * @jest-environment jsdom
 */
import { authenticatedFetch, forceLogout } from "utils/authenticatedFetch";
import { toast } from "sonner";

// Mock para sonner (toast)
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock para fetch
global.fetch = jest.fn();

describe("authenticatedFetch utils", () => {
  const mockToken = "test-token-123";

  // Mock do localStorage
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
  Object.defineProperty(window, "localStorage", { value: localStorageMock });

  // Mock do window.location
  delete window.location;
  window.location = {
    href: "",
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
  };

  // Setup e cleanup
  beforeEach(() => {
    jest.clearAllMocks();
    window.location.href = "";
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe("authenticatedFetch", () => {
    test("deve adicionar token de autenticação automaticamente", async () => {
      localStorageMock.getItem.mockReturnValue(mockToken);

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ data: "success" }),
      };
      global.fetch.mockResolvedValue(mockResponse);

      await authenticatedFetch("/api/test");

      expect(global.fetch).toHaveBeenCalledWith("/api/test", {
        headers: {
          Authorization: `Bearer ${mockToken}`,
        },
      });
    });

    test("deve interceptar erro 401 e forçar logout", async () => {
      localStorageMock.getItem.mockReturnValue(mockToken);

      const mockResponse = {
        ok: false,
        status: 401,
        clone: jest.fn().mockReturnValue({
          json: jest.fn().mockResolvedValue({
            error: "Sessão inválida. Por favor, faça login novamente.",
          }),
        }),
      };
      global.fetch.mockResolvedValue(mockResponse);

      await authenticatedFetch("/api/test");

      // Aguardar processamento assíncrono
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(localStorageMock.removeItem).toHaveBeenCalledWith("authToken");
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("user");
      expect(toast.error).toHaveBeenCalledWith(
        "Sua sessão expirou. Por favor, faça login novamente.",
      );
      expect(window.location.href).toBe("/login");
    });

    test("deve pular verificação de auth quando skipAuthCheck é true", async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ data: "success" }),
      };
      global.fetch.mockResolvedValue(mockResponse);

      await authenticatedFetch("/api/test", { skipAuthCheck: true });

      expect(global.fetch).toHaveBeenCalledWith("/api/test", {});
      expect(localStorageMock.getItem).not.toHaveBeenCalled();
    });

    test("deve mesclar headers personalizados com Authorization", async () => {
      localStorageMock.getItem.mockReturnValue(mockToken);

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ data: "success" }),
      };
      global.fetch.mockResolvedValue(mockResponse);

      await authenticatedFetch("/api/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ test: "data" }),
      });

      expect(global.fetch).toHaveBeenCalledWith("/api/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mockToken}`,
        },
        body: JSON.stringify({ test: "data" }),
      });
    });

    test("deve funcionar sem token quando skipAuthCheck é true", async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ data: "public" }),
      };
      global.fetch.mockResolvedValue(mockResponse);

      await authenticatedFetch("/api/public", { skipAuthCheck: true });

      expect(global.fetch).toHaveBeenCalledWith("/api/public", {});
    });

    test("deve interceptar diferentes tipos de erro 401", async () => {
      localStorageMock.getItem.mockReturnValue(mockToken);

      const errorMessages = [
        "Token de autenticação não fornecido",
        "Token inválido ou malformado",
        "Não autorizado",
        "Sessão inválida. Por favor, faça login novamente.",
      ];

      for (const errorMessage of errorMessages) {
        jest.clearAllMocks();
        window.location.href = "";

        const mockResponse = {
          ok: false,
          status: 401,
          clone: jest.fn().mockReturnValue({
            json: jest.fn().mockResolvedValue({
              error: errorMessage,
            }),
          }),
        };
        global.fetch.mockResolvedValue(mockResponse);

        await authenticatedFetch("/api/test");
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(window.location.href).toBe("/login");
        expect(toast.error).toHaveBeenCalled();
      }
    });

    test("deve interceptar erro 401 mesmo quando não consegue ler response", async () => {
      localStorageMock.getItem.mockReturnValue(mockToken);

      const mockResponse = {
        ok: false,
        status: 401,
        clone: jest.fn().mockReturnValue({
          json: jest.fn().mockRejectedValue(new Error("Parse error")),
        }),
      };
      global.fetch.mockResolvedValue(mockResponse);

      await authenticatedFetch("/api/test");
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(window.location.href).toBe("/login");
      expect(toast.error).toHaveBeenCalled();
    });
  });

  describe("forceLogout", () => {
    test("deve limpar localStorage e redirecionar para login", () => {
      const customMessage = "Mensagem customizada";

      forceLogout(customMessage);

      expect(localStorageMock.removeItem).toHaveBeenCalledWith("authToken");
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("user");
      expect(toast.error).toHaveBeenCalledWith(customMessage);
      expect(window.location.href).toBe("/login");
    });

    test("deve usar mensagem padrão quando não fornecida", () => {
      forceLogout();

      expect(toast.error).toHaveBeenCalledWith(
        "Sua sessão expirou. Por favor, faça login novamente.",
      );
      expect(window.location.href).toBe("/login");
    });
  });
});
