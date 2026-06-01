import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import sessao from "models/sessao.js";
import authMiddleware from "utils/authMiddleware.js";
import { requirePermission } from "utils/roleMiddleware.js";
import {
  requireTerapeutaAccess,
  terapeutaTemAcessoPaciente,
} from "utils/terapeutaMiddleware.js";
import { parsePagination, setPaginationHeaders } from "utils/pagination.js";

// Criar o router
const router = createRouter();

// Aplicar middleware de autenticação e autorização para proteger as rotas
router.use(authMiddleware).use(requirePermission("sessoes"));
router.use(requireTerapeutaAccess());

// Definir os handlers para cada método HTTP
router.get(getHandler);
router.post(postHandler);

// Exportar o handler com tratamento de erros
export default router.handler(controller.errorHandlers);

// Handler para listar todas as sessões
async function getHandler(request, response) {
  try {
    const {
      terapeuta_id,
      paciente_id,
      tipo_sessao,
      pagamento_realizado,
      nota_fiscal,
      repasse_realizado,
      dataInicio,
      dataFim,
      agendamento_id,
    } = request.query;
    const pagination = parsePagination(request.query, {
      defaultLimit: 500,
      maxLimit: 1000,
    });

    const userRole = request.user?.role || "terapeuta";
    const currentTerapeutaId = request.terapeutaId;

    if (userRole === "terapeuta") {
      if (!currentTerapeutaId) {
        return response.status(403).json({
          error: "Acesso negado",
          message:
            "Terapeuta não tem registro válido no sistema. Entre em contato com a administração.",
        });
      }

      if (paciente_id) {
        const temAcesso = await terapeutaTemAcessoPaciente(
          currentTerapeutaId,
          paciente_id,
        );
        if (!temAcesso) {
          return response.status(403).json({
            error: "Acesso negado",
            message:
              "Você só pode visualizar sessões dos seus próprios pacientes",
          });
        }
      }
    }

    const resolvedTerapeutaId =
      userRole === "terapeuta" ? currentTerapeutaId : terapeuta_id;

    const sessoes = await sessao.getFiltered({
      terapeuta_id: resolvedTerapeutaId,
      paciente_id,
      tipo_sessao,
      pagamento_realizado: parseBooleanQuery(pagamento_realizado),
      nota_fiscal,
      repasse_realizado: parseBooleanQuery(repasse_realizado),
      dataInicio,
      dataFim,
      agendamento_id,
      ...pagination,
    });

    setPaginationHeaders(response, {
      ...pagination,
      count: sessoes.length,
    });
    return response.status(200).json(sessoes);
  } catch (error) {
    console.error("Erro ao buscar sessões:", error);
    return response.status(500).json({ error: "Erro ao buscar sessões" });
  }
}

function parseBooleanQuery(value) {
  if (value === undefined) {
    return undefined;
  }

  const normalized = Array.isArray(value) ? value[0] : value;

  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  return undefined;
}

// Handler para criar uma nova sessão
async function postHandler(request, response) {
  try {
    const {
      terapeuta_id,
      paciente_id,
      tipoSessao,
      valorSessao,
      valorRepasse,
      agendamento_id,
      pagamentoRealizado = false,
      notaFiscal = "Não Emitida",
      repasseRealizado = false,
    } = request.body;

    // Validação básica dos campos obrigatórios
    const requiredFields = [
      "terapeuta_id",
      "paciente_id",
      "tipoSessao",
      "valorSessao",
    ];

    for (const field of requiredFields) {
      if (!request.body[field]) {
        return response.status(400).json({
          error: `O campo "${field}" é obrigatório`,
        });
      }
    }

    // Validar tipo de sessão
    const tiposSessaoValidos = [
      "Anamnese",
      "Atendimento",
      "Avaliação",
      "Visitar Escolar",
    ];
    if (!tiposSessaoValidos.includes(tipoSessao)) {
      return response.status(400).json({
        error: "Tipo de sessão inválido",
      });
    }

    // ATUALIZADO: Validar nota fiscal
    const notasFiscaisValidas = ["Não Emitida", "Emitida", "Enviada"];
    if (notaFiscal && !notasFiscaisValidas.includes(notaFiscal)) {
      return response.status(400).json({
        error: "Status de nota fiscal inválido",
      });
    }

    // Criar a sessão
    const novaSessao = await sessao.create({
      terapeuta_id,
      paciente_id,
      tipoSessao,
      valorSessao,
      valorRepasse,
      agendamento_id,
      pagamentoRealizado,
      notaFiscal,
      repasseRealizado,
    });

    return response.status(201).json(novaSessao);
  } catch (error) {
    console.error("Erro ao criar sessão:", error);
    return response.status(500).json({
      error: error.message || "Erro ao criar sessão",
    });
  }
}
