import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import database from "infra/database.js";
import agendamento from "models/agendamento.js";
import sessao from "models/sessao.js";
import authMiddleware from "utils/authMiddleware.js";
import { requireTerapeutaAccess } from "utils/terapeutaMiddleware.js";

// Criar o router
const router = createRouter();

// Aplicar middlewares
router.use(authMiddleware);
router.use(requireTerapeutaAccess());

// Definir handler para POST (batch operations)
router.post(postHandler);

// Exportar o handler com tratamento de erros
export default router.handler(controller.errorHandlers);

/**
 * Handler para operações em lote de marcação de agendamentos
 * Otimizado para performance em ambientes de homologação/produção
 */
async function postHandler(req, res) {
  const startTime = Date.now();

  try {
    const { operations, type } = req.body;

    // Validações básicas
    if (!operations || !Array.isArray(operations) || operations.length === 0) {
      return res.status(400).json({
        error: "Operations array is required and must not be empty",
        message: "Informe as operações a serem executadas",
      });
    }

    if (!type || !["sessaoRealizada", "falta", "status"].includes(type)) {
      return res.status(400).json({
        error: "Invalid operation type",
        message:
          "Tipo de operação deve ser 'sessaoRealizada', 'falta' ou 'status'",
      });
    }

    // Limitar número de operações por lote para evitar timeout
    const MAX_BATCH_SIZE = 50;
    if (operations.length > MAX_BATCH_SIZE) {
      return res.status(400).json({
        error: "Batch size too large",
        message: `Máximo de ${MAX_BATCH_SIZE} operações por lote`,
      });
    }

    console.log(
      `🚀 Iniciando lote de ${operations.length} operações do tipo '${type}'`,
    );

    // Detectar ambiente para usar otimizações específicas
    const isProduction =
      process.env.NODE_ENV === "production" ||
      process.env.VERCEL_ENV === "production";
    const isStaging = process.env.VERCEL_ENV === "preview";

    let processedCount = 0;
    let errors = [];
    const results = [];

    // Validar permissões do usuário para cada agendamento
    const userRole = req.user.role || "terapeuta";
    const currentTerapeutaId = req.terapeutaId;

    // Para terapeutas, verificar acesso a cada agendamento
    if (userRole === "terapeuta") {
      for (const operation of operations) {
        const { id } = operation;

        try {
          const agendamentoData = await agendamento.getById(id);

          if (!agendamentoData) {
            errors.push(`Agendamento ${id} não encontrado`);
            continue;
          }

          // Verificar se o terapeuta tem acesso ao agendamento
          if (agendamentoData.terapeuta_id !== currentTerapeutaId) {
            errors.push(`Acesso negado ao agendamento ${id}`);
            continue;
          }
        } catch (error) {
          errors.push(`Erro ao verificar agendamento ${id}: ${error.message}`);
          continue;
        }
      }

      // Se há muitos erros de permissão, cancelar operação
      if (errors.length > operations.length * 0.5) {
        return res.status(403).json({
          error: "Access denied",
          message: "Muitos agendamentos sem permissão de acesso",
          errors,
        });
      }
    }

    // Processar operações em lote ou individualmente baseado no ambiente
    if (isProduction || isStaging) {
      console.log("🏭 Usando processamento otimizado para staging/produção");

      try {
        const result = await processBatchOptimized(operations, type);
        processedCount = result.processedCount;
        errors = [...errors, ...result.errors];
        results.push(...result.results);
      } catch (batchError) {
        console.warn(
          "⚠️ Erro no processamento em lote, tentando individual:",
          batchError.message,
        );

        // Fallback para processamento individual
        const result = await processIndividually(operations, type);
        processedCount = result.processedCount;
        errors = [...errors, ...result.errors];
        results.push(...result.results);
      }
    } else {
      console.log("🔧 Usando processamento individual para desenvolvimento");

      const result = await processIndividually(operations, type);
      processedCount = result.processedCount;
      errors = [...errors, ...result.errors];
      results.push(...result.results);
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(
      `✅ Lote processado: ${processedCount}/${operations.length} operações em ${duration}ms`,
    );

    // Retornar resultado
    const response = {
      message: `${processedCount} operações de ${type} processadas com sucesso`,
      processedCount,
      totalOperations: operations.length,
      errors: errors.length > 0 ? errors : undefined,
      results,
      metadata: {
        duration: `${duration}ms`,
        type,
        environment: isProduction
          ? "production"
          : isStaging
            ? "staging"
            : "development",
      },
    };

    const statusCode = errors.length > 0 ? 207 : 200; // 207 Multi-Status se há erros parciais
    return res.status(statusCode).json(response);
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.error(
      `❌ Erro no processamento em lote após ${duration}ms:`,
      error,
    );

    return res.status(500).json({
      error: "Batch processing failed",
      message: "Erro ao processar operações em lote",
      details: error.message,
      metadata: {
        duration: `${duration}ms`,
      },
    });
  }
}

/**
 * Processamento otimizado para ambientes de staging/produção
 */
async function processBatchOptimized(operations, type) {
  let processedCount = 0;
  const errors = [];
  const results = [];

  try {
    // Construir query única para atualizar múltiplos registros
    const batchUpdateSql = buildBatchUpdateQuery(operations, type);

    if (batchUpdateSql) {
      const updateResult = await database.query(batchUpdateSql);
      processedCount = updateResult.rowCount || 0;

      console.log(`🚀 BATCH: ${processedCount} agendamentos atualizados`);

      // Processar sessões relacionadas se necessário
      if (type === "sessaoRealizada" || type === "falta") {
        const sessaoResult = await processSessoesForBatch(operations, type);
        results.push({
          type: "sessoes",
          processed: sessaoResult.processedCount,
          errors: sessaoResult.errors,
        });
      }

      results.push({
        type: "agendamentos",
        processed: processedCount,
        errors: [],
      });
    }
  } catch (error) {
    console.error("Erro no processamento otimizado:", error);
    throw error;
  }

  return { processedCount, errors, results };
}

/**
 * Processamento individual (fallback)
 */
async function processIndividually(operations, type) {
  let processedCount = 0;
  const errors = [];
  const results = [];

  for (const operation of operations) {
    try {
      const { id, value } = operation;

      const updateData = {
        [type]: value,
      };

      await agendamento.update(id, updateData);
      processedCount++;
    } catch (error) {
      console.error(`Erro ao processar operação ${operation.id}:`, error);
      errors.push(`${operation.id}: ${error.message}`);
    }
  }

  results.push({
    type: "agendamentos",
    processed: processedCount,
    errors,
  });

  return { processedCount, errors, results };
}

/**
 * Constrói query SQL para atualização em lote
 */
function buildBatchUpdateQuery(operations, type) {
  if (operations.length === 0) return null;

  const cases = [];
  const ids = [];

  for (const operation of operations) {
    const { id, value } = operation;
    ids.push(id);

    if (type === "status") {
      cases.push(`WHEN '${id}' THEN '${value}'`);
    } else {
      cases.push(`WHEN '${id}' THEN ${value ? "true" : "false"}`);
    }
  }

  const columnName =
    type === "sessaoRealizada"
      ? "sessao_realizada"
      : type === "falta"
        ? "falta"
        : "status_agendamento";

  return {
    text: `
      UPDATE agendamentos 
      SET ${columnName} = CASE id ${cases.join(" ")} END,
          updated_at = NOW()
      WHERE id = ANY($1::uuid[])
    `,
    values: [ids],
  };
}

/**
 * Processa sessões relacionadas para operações de sessaoRealizada/falta
 */
async function processSessoesForBatch(operations, _type) {
  let processedCount = 0;
  const errors = [];

  try {
    const sessoesParaCriar = [];
    const sessoesParaRemover = [];

    for (const operation of operations) {
      const { id, value } = operation;

      try {
        const agendamentoData = await agendamento.getById(id);

        if (!agendamentoData) continue;

        const shouldCreateSession =
          value && agendamentoData.statusAgendamento !== "Cancelado";

        // Verificar se já existe sessão
        const sessoesExistentes = await sessao.getFiltered({
          agendamento_id: id,
        });

        if (shouldCreateSession && sessoesExistentes.length === 0) {
          // Criar nova sessão
          sessoesParaCriar.push({
            terapeuta_id: agendamentoData.terapeuta_id,
            paciente_id: agendamentoData.paciente_id,
            tipoSessao: mapearTipoAgendamentoParaTipoSessao(
              agendamentoData.tipoAgendamento,
            ),
            valorSessao: agendamentoData.valorAgendamento,
            statusSessao: "Pagamento Pendente",
            agendamento_id: id,
          });
        } else if (!shouldCreateSession && sessoesExistentes.length > 0) {
          // Remover sessão existente
          sessoesParaRemover.push(...sessoesExistentes.map((s) => s.id));
        }
      } catch (error) {
        console.error(
          `Erro ao processar sessão para agendamento ${id}:`,
          error,
        );
        errors.push(`Sessão ${id}: ${error.message}`);
      }
    }

    // Criar sessões em lote
    if (sessoesParaCriar.length > 0) {
      try {
        const created = await sessao.createBatch(sessoesParaCriar);
        processedCount += created;
        console.log(`🚀 BATCH: ${created} sessões criadas`);
      } catch (error) {
        console.error("Erro ao criar sessões em lote:", error);
        errors.push(`Criação de sessões: ${error.message}`);
      }
    }

    // Remover sessões em lote
    if (sessoesParaRemover.length > 0) {
      try {
        const removed = await sessao.removeBatchByIds(sessoesParaRemover);
        processedCount += removed;
        console.log(`🚀 BATCH: ${removed} sessões removidas`);
      } catch (error) {
        console.error("Erro ao remover sessões em lote:", error);
        errors.push(`Remoção de sessões: ${error.message}`);
      }
    }
  } catch (error) {
    console.error("Erro no processamento de sessões:", error);
    errors.push(`Processamento de sessões: ${error.message}`);
  }

  return { processedCount, errors };
}

/**
 * Mapeia tipos de agendamento para tipos de sessão
 */
function mapearTipoAgendamentoParaTipoSessao(tipoAgendamento) {
  const mapeamento = {
    Sessão: "Atendimento",
    "Orientação Parental": "Atendimento",
    "Visita Escolar": "Visitar Escolar",
    Supervisão: "Atendimento",
    Outros: "Atendimento",
  };

  return mapeamento[tipoAgendamento] || "Atendimento";
}
