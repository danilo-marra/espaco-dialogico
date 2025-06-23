// Mock do modelo invite para testes
const validInviteCode = "test-invite-code";

// Mock do modelo de convite que aceita qualquer código de convite em teste
const inviteMock = {
  getByCode: async (code) => {
    // Se é o código especial para testes, retorna um convite válido
    if (code === validInviteCode) {
      return {
        id: "test-invite-id",
        code: validInviteCode,
        email: null, // Não restringe email
        role: "terapeuta",
        used: false,
        expires_at: new Date(Date.now() + 86400000).toISOString(), // Expira em 24h
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    // Para qualquer outro código em ambiente de teste, lançar erro
    throw new Error("Código de convite inválido");
  },

  // eslint-disable-next-line no-unused-vars
  validateAndUse: async (code, userId) => {
    // Em teste, apenas retorna true sem fazer nada
    return true;
  },
};

export default inviteMock;
export { validInviteCode };
