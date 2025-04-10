/**
 * Configurações para mocks de API usando MSW
 */

import { rest } from "msw";
import { setupServer } from "msw/node";

// Criar servidor MSW com configurações default
export function createMockServer(handlers = []) {
  const server = setupServer(...handlers);

  return {
    server,
    // Helpers para adicionar handlers comuns
    addTerapeutaHandlers: (customHandlers = {}) => {
      const defaultHandlers = {
        // Handler para GET terapeutas
        getTerapeutas: rest.get(
          "http://localhost:3000/api/v1/terapeutas",
          (req, res, ctx) => {
            return res(
              ctx.status(200),
              ctx.json([
                {
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
                },
              ]),
            );
          },
        ),

        // Handler para GET terapeutas - versão sem hostname (para requisições relativas)
        getTerapeutasRelative: rest.get(
          "/api/v1/terapeutas",
          (req, res, ctx) => {
            return res(
              ctx.status(200),
              ctx.json([
                {
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
                },
              ]),
            );
          },
        ),

        // Handler para POST terapeutas
        postTerapeuta: rest.post(
          "http://localhost:3000/api/v1/terapeutas",
          (req, res, ctx) => {
            return res(
              ctx.status(201),
              ctx.json({
                id: "novo-uuid-gerado",
                nome: "Terapeuta Teste",
                telefone: "(21) 98765-4321",
                email: "terapeuta.teste@teste.com",
                endereco: "Rua das Flores, 123",
                dt_entrada: "2025-04-10T03:00:00.000Z",
                chave_pix: "terapeuta123",
                created_at: "2025-04-10T15:30:00.000Z",
                updated_at: "2025-04-10T15:30:00.000Z",
              }),
            );
          },
        ),

        // Handler para PUT terapeutas/:id
        updateTerapeuta: rest.put(
          /.*?\/terapeutas\/.*/, // Regexp para qualquer ID
          (req, res, ctx) => {
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
          },
        ),

        // Handler para PUT terapeutas/:id - versão relativa
        updateTerapeutaRelative: rest.put(
          "/api/v1/terapeutas/:id", // Usando path params para capturar o ID
          (req, res, ctx) => {
            console.log(
              "MSW interceptou requisição PUT para /api/v1/terapeutas/:id",
            );

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
          },
        ),

        // Handler para DELETE terapeutas/:id
        deleteTerapeuta: rest.delete(
          /.*?\/terapeutas\/.*/, // Regexp para qualquer ID
          (req, res, ctx) => {
            return res(ctx.status(204));
          },
        ),

        // Combina os handlers padrão com os customizados
        ...customHandlers,
      };

      // Adiciona os handlers ao servidor
      Object.values(defaultHandlers).forEach((handler) => {
        server.use(handler);
      });

      return defaultHandlers;
    },
  };
}

// Mock para status da API
export const mockApiStatus = {
  updated_at: new Date().toISOString(),
  dependencies: {
    database: {
      version: "16.0",
      max_connections: 100,
      opened_connections: 1,
    },
  },
};

// Configurar mocks para status da API
export function setupStatusApiMock() {
  global.fetch = jest.fn().mockImplementation(() =>
    Promise.resolve({
      status: 200,
      json: () => Promise.resolve(mockApiStatus),
    }),
  );

  return mockApiStatus;
}
