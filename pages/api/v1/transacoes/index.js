import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import transacao from "models/transacao.js";
import authMiddleware from "utils/authMiddleware.js";
import { requirePermission } from "utils/roleMiddleware.js";

// Criar o router
const router = createRouter();

// Aplicar middleware de autenticação e autorização para proteger as rotas
router.use(authMiddleware).use(requirePermission("transacoes"));

// Definir os handlers para cada método HTTP
router.get(getHandler);
router.post(postHandler);

// Exportar o handler com tratamento de erros
export default router.handler(controller.errorHandlers);

// Handler para listar transações
async function getHandler(request, response) {
  try {
    const { periodo, tipo, categoria, dataInicial, dataFinal } = request.query;

    const filters = {};
    if (periodo) filters.periodo = periodo;
    if (tipo) filters.tipo = tipo;
    if (categoria) filters.categoria = categoria;
    if (dataInicial) filters.dataInicial = dataInicial;
    if (dataFinal) filters.dataFinal = dataFinal;

    const transacoes = await transacao.findAll(filters);

    return response.status(200).json(transacoes);
  } catch (error) {
    console.error("Erro ao buscar transações:", error);
    return response.status(500).json({
      error: "Erro interno do servidor ao buscar transações",
    });
  }
}

// Handler para criar uma nova transação
async function postHandler(request, response) {
  try {
    const { tipo, categoria, descricao, valor, data, observacoes } =
      request.body;

    // Validações básicas
    if (!tipo || !categoria || !descricao || !valor || !data) {
      return response.status(400).json({
        error: "Todos os campos obrigatórios devem ser preenchidos",
      });
    }

    if (!["entrada", "saida"].includes(tipo)) {
      return response.status(400).json({
        error: "Tipo deve ser 'entrada' ou 'saida'",
      });
    }

    if (parseFloat(valor) <= 0 || isNaN(parseFloat(valor))) {
      return response.status(400).json({
        error: "Valor deve ser um número válido maior que zero",
      });
    }

    const transacaoData = {
      tipo,
      categoria,
      descricao,
      valor: parseFloat(valor),
      data,
      usuario_id: request.user.id,
      observacoes,
    };

    const novaTransacao = await transacao.create(transacaoData);

    return response.status(201).json({
      message: "Transação criada com sucesso",
      transacao: novaTransacao,
    });
  } catch (error) {
    console.error("Erro ao criar transação:", error);

    if (error.message.includes("Erro ao criar transação")) {
      return response.status(400).json({ error: error.message });
    }

    return response.status(500).json({
      error: "Erro interno do servidor ao criar transação",
    });
  }
}
