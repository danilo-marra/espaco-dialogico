/**
 * Normaliza o role para lowercase para garantir consistência
 * @param {string} role - Role do usuário
 * @returns {string} - Role normalizado
 */
function normalizeRole(role) {
  if (!role) return "terapeuta";

  // Converter para lowercase e mapear roles conhecidos
  const normalized = role.toLowerCase();

  // Mapeamento de roles alternativos
  const roleMap = {
    administrador: "admin",
    secretária: "secretaria",
    secretario: "secretaria",
  };

  return roleMap[normalized] || normalized;
}

// Definição de permissões por role (em lowercase)
const ROLE_PERMISSIONS = {
  admin: [
    "agendamentos",
    "pacientes",
    "sessoes",
    "terapeutas",
    "transacoes",
    "convites",
    "usuarios",
    "perfil",
  ],
  terapeuta: [
    "agendamentos",
    "pacientes", // Adicionado: terapeuta precisa acessar pacientes (será filtrado pelo middleware)
    "terapeutas", // Adicionado: terapeuta precisa acessar sua própria informação
    "perfil",
  ],
  secretaria: [
    "agendamentos",
    "pacientes",
    "sessoes",
    "terapeutas",
    "transacoes",
    "perfil",
  ],
};

// Mapeamento de rotas para recursos
const ROUTE_RESOURCE_MAP = {
  "/api/agendamentos": "agendamentos",
  "/api/pacientes": "pacientes",
  "/api/sessoes": "sessoes",
  "/api/terapeutas": "terapeutas",
  "/api/transacoes": "transacoes",
  "/api/convites": "convites",
  "/api/users": "usuarios",
  "/api/user": "perfil",
  "/dashboard/agenda": "agendamentos",
  "/dashboard/pacientes": "pacientes",
  "/dashboard/sessoes": "sessoes",
  "/dashboard/terapeutas": "terapeutas",
  "/dashboard/transacoes": "transacoes",
  "/dashboard/convites": "convites",
  "/dashboard/usuarios": "usuarios",
  "/dashboard/perfil": "perfil",
};

/**
 * Verifica se um usuário tem permissão para acessar um recurso
 * @param {string} userRole - Role do usuário
 * @param {string} resource - Recurso que está sendo acessado
 * @param {object} context - Contexto adicional (opcional)
 * @param {string} context.userId - ID do usuário que faz a requisição
 * @param {string} context.targetTerapeutaId - ID do terapeuta alvo (para verificações específicas)
 * @param {string} context.targetPacienteId - ID do paciente alvo (para verificações específicas)
 * @returns {boolean} - Se tem permissão ou não
 */
export function hasPermission(userRole, resource, context = {}) {
  const normalizedRole = normalizeRole(userRole);
  const permissions = ROLE_PERMISSIONS[normalizedRole];

  // Verificar se o role tem permissão básica para o recurso
  if (!permissions || !permissions.includes(resource)) {
    return false;
  }

  // Para terapeutas, aplicar verificações adicionais
  if (normalizedRole === "terapeuta" && context) {
    // Se está tentando acessar agendamentos, verificar se é dos seus próprios pacientes
    if (resource === "agendamentos" && context.targetPacienteId) {
      // Esta verificação será feita na camada de API, pois precisa consultar o banco
      // Por ora, permitir na camada de middleware e fazer a verificação na API
      return true;
    }
  }

  return true;
}

/**
 * Obtém o recurso baseado na URL/rota
 * @param {string} url - URL ou rota
 * @returns {string|null} - Nome do recurso ou null se não encontrado
 */
export function getResourceFromRoute(url) {
  // Normalizar a URL removendo query parameters e fragmentos
  const cleanUrl = url.split("?")[0].split("#")[0];

  // Buscar correspondência exata primeiro
  if (ROUTE_RESOURCE_MAP[cleanUrl]) {
    return ROUTE_RESOURCE_MAP[cleanUrl];
  }

  // Buscar correspondência por prefixo para rotas dinâmicas
  for (const route in ROUTE_RESOURCE_MAP) {
    if (cleanUrl.startsWith(route)) {
      return ROUTE_RESOURCE_MAP[route];
    }
  }

  return null;
}

/**
 * Middleware para verificar permissões de role em APIs
 * @param {string} requiredResource - Recurso necessário para acessar a rota
 * @returns {Function} Middleware function
 */
export function requirePermission(requiredResource) {
  return (req, res, next) => {
    // Este middleware assume que o authMiddleware já rodou e populou req.user
    if (!req.user) {
      return res.status(401).json({
        error: "Não autorizado",
        message: "Usuário não autenticado.",
      });
    }

    const userRole = normalizeRole(req.user.role);

    if (!hasPermission(userRole, requiredResource)) {
      return res.status(403).json({
        error: "Acesso negado",
        message: `Você não tem permissão para acessar o recurso: ${requiredResource}`,
      });
    }

    return next();
  };
}

/**
 * Função para envolver um handler de API com verificação de permissões
 * @param {Function} handler - Handler da API que será protegido
 * @param {string} requiredResource - Recurso necessário
 * @returns {Function} Handler com autenticação e autorização
 */
export function withRolePermission(handler, requiredResource) {
  // Este wrapper assume que o withAuthMiddleware será aplicado primeiro,
  // populando req.user.
  return (req, res) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Não autorizado",
        message: "Usuário não autenticado.",
      });
    }

    const userRole = normalizeRole(req.user.role);

    if (!hasPermission(userRole, requiredResource)) {
      return res.status(403).json({
        error: "Acesso negado",
        message: `Você não tem permissão para acessar o recurso: ${requiredResource}`,
      });
    }

    return handler(req, res);
  };
}

/**
 * Hook para verificar permissões no lado do cliente
 * @param {string} userRole - Role do usuário
 * @param {string} resource - Recurso que está sendo verificado
 * @returns {boolean} - Se tem permissão ou não
 */
export function usePermission(userRole, resource) {
  return hasPermission(normalizeRole(userRole), resource);
}

export { ROLE_PERMISSIONS, ROUTE_RESOURCE_MAP };
