import { verifyToken } from "./auth.js";

// Definição de permissões por role
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
  terapeuta: ["agendamentos", "perfil"],
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
 * @returns {boolean} - Se tem permissão ou não
 */
export function hasPermission(userRole, resource) {
  const permissions = ROLE_PERMISSIONS[userRole];
  return permissions && permissions.includes(resource);
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
  return async (req, res, next) => {
    try {
      // Verificar se o usuário está autenticado
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          error: "Não autorizado",
          message: "Token de autenticação não fornecido",
        });
      }

      const token = authHeader.split(" ")[1];
      const decoded = verifyToken(token);

      if (!decoded) {
        return res.status(401).json({
          error: "Não autorizado",
          message: "Token inválido ou expirado",
        });
      }

      // Adicionar usuário à requisição
      req.user = decoded; // Verificar permissão
      const userRole = decoded.role || "terapeuta";

      if (!hasPermission(userRole, requiredResource)) {
        return res.status(403).json({
          error: "Acesso negado",
          message: `Você não tem permissão para acessar ${requiredResource}`,
        });
      }

      return next();
    } catch (error) {
      console.error("Erro de autorização:", error);
      return res.status(500).json({
        error: "Erro interno",
        message: "Falha na verificação de permissões",
      });
    }
  };
}

/**
 * Função para envolver um handler de API com verificação de permissões
 * @param {Function} handler - Handler da API que será protegido
 * @param {string} requiredResource - Recurso necessário
 * @returns {Function} Handler com autenticação e autorização
 */
export function withRolePermission(handler, requiredResource) {
  return async (req, res) => {
    try {
      // Verificar se o token está presente no cabeçalho
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          error: "Não autorizado",
          message: "Token de autenticação não fornecido",
        });
      }

      // Extrair e verificar o token
      const token = authHeader.split(" ")[1];
      const decoded = verifyToken(token);

      if (!decoded) {
        return res.status(401).json({
          error: "Não autorizado",
          message: "Token inválido ou expirado",
        });
      }

      // Adicionar usuário decodificado à solicitação
      req.user = decoded; // Verificar permissão
      const userRole = decoded.role || "terapeuta";

      if (!hasPermission(userRole, requiredResource)) {
        return res.status(403).json({
          error: "Acesso negado",
          message: `Você não tem permissão para acessar ${requiredResource}`,
        });
      }

      // Prosseguir para o handler
      return handler(req, res);
    } catch (error) {
      console.error("Erro de autenticação/autorização:", error);
      return res.status(500).json({
        error: "Erro interno",
        message: "Falha na verificação de permissões",
      });
    }
  };
}

/**
 * Hook para verificar permissões no lado do cliente
 * @param {string} userRole - Role do usuário
 * @param {string} resource - Recurso que está sendo verificado
 * @returns {boolean} - Se tem permissão ou não
 */
export function usePermission(userRole, resource) {
  return hasPermission(userRole, resource);
}

export { ROLE_PERMISSIONS, ROUTE_RESOURCE_MAP };
