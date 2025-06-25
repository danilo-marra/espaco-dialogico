import { verifyToken } from "./auth.js";
import database from "infra/database.js";

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

/**
 * Middleware específico para verificar permissões de terapeutas
 * Verifica se o terapeuta só está acessando dados dos seus próprios pacientes
 */
export function requireTerapeutaAccess() {
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
      } // Adicionar usuário à requisição
      req.user = decoded;
      const userRole = normalizeRole(decoded.role || "terapeuta");

      // Se não for terapeuta, permitir acesso (admin e secretaria têm acesso total)
      if (userRole !== "terapeuta") {
        return next();
      } // Para terapeutas, verificar se tem acesso aos dados solicitados
      const userId = decoded.id;

      // Buscar o terapeuta associado a este usuário
      const terapeutaResult = await database.query({
        text: "SELECT id FROM terapeutas WHERE user_id = $1",
        values: [userId],
      });

      if (terapeutaResult.rows.length === 0) {
        console.warn(
          `Usuário ${userId} com role terapeuta não tem registro na tabela terapeutas`,
        );

        // ALTERADO: Permitir acesso mesmo sem registro de terapeuta
        // Isso pode acontecer quando o terapeuta ainda não foi completamente configurado
        req.terapeutaId = null; // Indicar que não tem terapeuta associado

        // Continuar com a requisição, mas a API poderá aplicar filtros restritivos
        return next();
      }

      const terapeutaId = terapeutaResult.rows[0].id;
      req.terapeutaId = terapeutaId;

      return next();
    } catch (error) {
      console.error("Erro de autorização do terapeuta:", error);
      return res.status(500).json({
        error: "Erro interno",
        message: "Falha na verificação de permissões",
      });
    }
  };
}

/**
 * Verifica se um terapeuta tem acesso a um paciente específico
 * @param {string} terapeutaId - ID do terapeuta
 * @param {string} pacienteId - ID do paciente
 * @returns {Promise<boolean>} - Se tem acesso ou não
 */
export async function terapeutaTemAcessoPaciente(terapeutaId, pacienteId) {
  try {
    const result = await database.query({
      text: "SELECT COUNT(*) FROM pacientes WHERE id = $1 AND terapeuta_id = $2",
      values: [pacienteId, terapeutaId],
    });

    return parseInt(result.rows[0].count) > 0;
  } catch (error) {
    console.error("Erro ao verificar acesso do terapeuta ao paciente:", error);
    return false;
  }
}

/**
 * Verifica se um terapeuta tem acesso a um agendamento específico
 * @param {string} terapeutaId - ID do terapeuta
 * @param {string} agendamentoId - ID do agendamento
 * @returns {Promise<boolean>} - Se tem acesso ou não
 */
export async function terapeutaTemAcessoAgendamento(
  terapeutaId,
  agendamentoId,
) {
  try {
    const result = await database.query({
      text: "SELECT COUNT(*) FROM agendamentos WHERE id = $1 AND terapeuta_id = $2",
      values: [agendamentoId, terapeutaId],
    });

    return parseInt(result.rows[0].count) > 0;
  } catch (error) {
    console.error(
      "Erro ao verificar acesso do terapeuta ao agendamento:",
      error,
    );
    return false;
  }
}

/**
 * Verifica se um terapeuta pode editar um agendamento específico
 * (baseado no terapeuta_id do agendamento)
 * @param {string} terapeutaId - ID do terapeuta logado
 * @param {object} agendamento - Dados do agendamento
 * @returns {boolean} - Se pode editar ou não
 */
export function terapeutaPodeEditarAgendamento(terapeutaId, agendamento) {
  if (!terapeutaId || !agendamento) return false;
  return agendamento.terapeuta_id === terapeutaId;
}

/**
 * Filtrar agendamentos para mostrar todos para admin/secretaria,
 * e TODOS também para terapeutas (mas eles só podem editar os próprios)
 * @param {string} userRole - Role do usuário
 * @param {string} terapeutaId - ID do terapeuta (apenas para role terapeuta)
 * @param {object} filters - Filtros adicionais
 * @returns {object} - Filtros modificados conforme a role
 */
export function applyTerapeutaFilters(
  _userRole,
  _terapeutaId = null,
  filters = {},
) {
  // ALTERADO: Todos os roles (admin, secretaria, terapeuta) podem ver todos os agendamentos
  // A restrição de edição é feita em nível de interface e nas operações PUT/DELETE
  return filters;
}
