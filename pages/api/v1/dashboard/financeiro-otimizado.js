import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import financeiroOtimizado from "models/financeiroOtimizado.js";
import { requirePermission } from "utils/roleMiddleware.js";

// Criar o router
const router = createRouter();

// Aplicar middleware de autenticação e autorização
router.use(requirePermission("sessoes"));

// Endpoint para limpar o cache
router.post(async (request, response) => {
  if (request.query.clearCache === "true") {
    financeiroOtimizado.clearCache();
    console.log("Cache do dashboard financeiro limpo.");
    return response.status(200).json({ message: "Cache cleared" });
  }
  response.status(404).end();
});

// Definir os handlers
router.get(getHandler);

// Exportar o handler com tratamento de erros
export default router.handler(controller.errorHandlers);

// Handler otimizado para obter dados financeiros do dashboard
async function getHandler(request, response) {
  const startTime = Date.now();

  try {
    const { periodo, historico } = request.query;

    // Headers para otimização de cache
    response.setHeader(
      "Cache-Control",
      "public, max-age=300, stale-while-revalidate=60",
    ); // 5 min cache, 1 min stale
    response.setHeader("X-Content-Type-Options", "nosniff");

    if (historico === "true") {
      // Usar função otimizada para histórico
      const dadosHistorico =
        await financeiroOtimizado.obterHistoricoFinanceiroOtimizado();

      const endTime = Date.now();

      // Header com tempo de resposta para debugging
      response.setHeader("X-Response-Time", `${endTime - startTime}ms`);
      response.setHeader("X-Data-Source", dadosHistorico.source);

      // Retornar apenas o array de histórico que o hook espera
      return response.status(200).json(dadosHistorico.historico || []);
    }

    if (periodo) {
      // Validar formato do período
      if (!/^\d{4}-\d{2}$/.test(periodo)) {
        return response.status(400).json({
          error: "Formato de período inválido. Use YYYY-MM",
        });
      }

      // Usar função otimizada para período específico
      const dadosPeriodo =
        await financeiroOtimizado.obterResumoFinanceiroOtimizado(periodo);

      const endTime = Date.now();

      response.setHeader("X-Response-Time", `${endTime - startTime}ms`);
      response.setHeader("X-Data-Source", dadosPeriodo.source);

      return response.status(200).json(dadosPeriodo);
    }

    // Se não especificar período, retorna o mês atual
    const agora = new Date();
    const periodoAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;

    const dadosAtual =
      await financeiroOtimizado.obterResumoFinanceiroOtimizado(periodoAtual);

    const endTime = Date.now();

    response.setHeader("X-Response-Time", `${endTime - startTime}ms`);
    response.setHeader("X-Data-Source", dadosAtual.source);

    return response.status(200).json(dadosAtual);
  } catch (error) {
    const endTime = Date.now();
    console.error(
      `❌ Erro ao buscar dados financeiros (${endTime - startTime}ms):`,
      error,
    );

    response.setHeader("X-Response-Time", `${endTime - startTime}ms`);
    response.setHeader("X-Data-Source", "error");

    // Retornar erro mais específico baseado no tipo
    if (error.message?.includes("inválido")) {
      return response.status(400).json({
        error: error.message,
        responseTime: `${endTime - startTime}ms`,
      });
    }

    if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
      return response.status(503).json({
        error:
          "Serviço temporariamente indisponível. Tente novamente em alguns instantes.",
        responseTime: `${endTime - startTime}ms`,
        retryAfter: 30,
      });
    }

    return response.status(500).json({
      error: "Erro interno do servidor ao buscar dados financeiros",
      responseTime: `${endTime - startTime}ms`,
    });
  }
}
