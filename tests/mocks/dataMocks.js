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

export const mockNovoTerapeuta = {
  id: "novo-uuid-gerado",
  nome: "Maria Silva",
  telefone: "(21) 98765-4321",
  email: "maria.silva@teste.com",
  endereco: "Rua das Flores, 123",
  dt_entrada: "2025-04-10T03:00:00.000Z",
  chave_pix: "maria123",
  created_at: "2025-04-10T15:30:00.000Z",
  updated_at: "2025-04-10T15:30:00.000Z",
};

export const mockStatus = {
  updated_at: new Date().toISOString(),
  dependencies: {
    database: {
      version: "16.0",
      max_connections: 100,
      opened_connections: 1,
    },
  },
};
