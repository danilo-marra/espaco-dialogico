import { rest } from "msw";
import { setupServer } from "msw/node";
import { mockStatus, mockNovoTerapeuta } from "./dataMocks";

// Handlers padrão para APIs
const handlers = [
  // GET /api/v1/status
  rest.get("http://localhost:3000/api/v1/status", (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockStatus));
  }),

  // POST /api/v1/terapeutas
  rest.post("http://localhost:3000/api/v1/terapeutas", (req, res, ctx) => {
    console.log("MSW interceptou requisição POST para /api/v1/terapeutas");
    return res(ctx.status(201), ctx.json(mockNovoTerapeuta));
  }),
];

// Exportar o servidor MSW configurado
export const server = setupServer(...handlers);

// Configuração do fetch mock
export function setupFetchMock() {
  global.fetch = jest.fn().mockImplementation(() =>
    Promise.resolve({
      status: 200,
      json: () => Promise.resolve(mockStatus),
    }),
  );
}
