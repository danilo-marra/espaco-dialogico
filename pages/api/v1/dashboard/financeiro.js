import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import financeiro from "models/financeiro.js";
import { requirePermission } from "utils/roleMiddleware.js";

// Criar o router
const router = createRouter();

// Aplicar middleware de autenticação e autorização
router.use(requirePermission("sessoes"));

// Definir os handlers
router.get(getHandler);

// Exportar o handler com tratamento de erros
export default router.handler(controller.errorHandlers);

// Handler para obter dados financeiros do dashboard
async function getHandler(request, response) {
  try {
    const { periodo, historico } = request.query;

    if (historico === "true") {
      // Retornar histórico dos últimos 6 meses
      const dadosHistorico = await financeiro.obterHistoricoFinanceiro();
      return response.status(200).json(dadosHistorico);
    }

    if (periodo) {
      // Retornar dados de um período específico
      const dadosPeriodo =
        await financeiro.obterResumoFinanceiroPorPeriodo(periodo);
      return response.status(200).json(dadosPeriodo);
    }

    // Se não especificar período, retorna o mês atual
    const dadosAtual = await financeiro.obterMetricasFinanceiras();
    return response.status(200).json(dadosAtual);
  } catch (error) {
    console.error("Erro ao buscar dados financeiros:", error);
    return response.status(500).json({
      error: "Erro interno do servidor ao buscar dados financeiros",
    });
  }
}
