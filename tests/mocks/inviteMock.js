// Mock do modelo invite para testes
const validInviteCode = "test-invite-code";

// Set para armazenar códigos de convite válidos criados durante os testes
const validInviteCodes = new Set([validInviteCode, "test-invite-code-2"]);

// Mock do modelo de convite que aceita qualquer código de convite em teste
const inviteMock = {
  getByCode: async (code) => {
    // Se é um código válido (fixo ou criado dinamicamente), retorna um convite válido
    if (validInviteCodes.has(code) || code.startsWith("TEST-")) {
      return {
        id: "test-invite-id",
        code: code,
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

  // Função para adicionar códigos válidos (usada pelos testes)
  addValidCode: (code) => {
    validInviteCodes.add(code);
  },
};

export default inviteMock;
export { validInviteCode };
