import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import sessao from "models/sessao.js";
import authMiddleware from "utils/authMiddleware.js";

// Criar o router
const router = createRouter();

// Aplicar middleware de autenticação para proteger as rotas
router.use(authMiddleware);

// Definir os handlers para cada método HTTP
router.get(getHandler);
router.post(postHandler);

// Exportar o handler com tratamento de erros
export default router.handler(controller.errorHandlers);

// Handler para listar todas as sessões
async function getHandler(request, response) {
  try {
    // Opção para filtrar por terapeuta, paciente, ou status
    const { terapeuta_id, paciente_id, status } = request.query;

    let sessoes;
    if (terapeuta_id || paciente_id || status) {
      sessoes = await sessao.getFiltered({ terapeuta_id, paciente_id, status });
    } else {
      sessoes = await sessao.getAll();
    }

    return response.status(200).json(sessoes);
  } catch (error) {
    console.error("Erro ao buscar sessões:", error);
    return response.status(500).json({ error: "Erro ao buscar sessões" });
  }
}

// Handler para criar uma nova sessão
async function postHandler(request, response) {
  try {
    const {
      terapeuta_id,
      paciente_id,
      tipoSessao,
      valorSessao,
      statusSessao = "Pagamento Pendente",
      agendamento_id,
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

    // Validar status da sessão
    const statusSessaoValidos = [
      "Pagamento Pendente",
      "Pagamento Realizado",
      "Nota Fiscal Emitida",
      "Nota Fiscal Enviada",
    ];
    if (statusSessao && !statusSessaoValidos.includes(statusSessao)) {
      return response.status(400).json({
        error: "Status de sessão inválido",
      });
    }

    // Criar a sessão
    const novaSessao = await sessao.create({
      terapeuta_id,
      paciente_id,
      tipoSessao,
      valorSessao,
      statusSessao,
      agendamento_id,
    });

    return response.status(201).json(novaSessao);
  } catch (error) {
    console.error("Erro ao criar sessão:", error);
    return response.status(500).json({
      error: error.message || "Erro ao criar sessão",
    });
  }
}
