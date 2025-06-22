import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import agendamento from "models/agendamento.js";
import sessao from "models/sessao.js";
import authMiddleware from "utils/authMiddleware.js";

// Criar o router
const router = createRouter();

// Aplicar middleware de autenticação para proteger as rotas
router.use(authMiddleware);

// Definir os handlers para cada método HTTP
router.get(getHandler);
router.post(postHandler);

// Handler para obter os agendamentos
async function getHandler(req, res) {
  // Verificar se há filtros na query string
  const { terapeuta_id, paciente_id, status, dataInicio, dataFim } = req.query;

  let agendamentos;

  // Se existirem filtros, usar getFiltered, caso contrário, usar getAll
  if (terapeuta_id || paciente_id || status || dataInicio || dataFim) {
    agendamentos = await agendamento.getFiltered({
      terapeuta_id,
      paciente_id,
      status,
      dataInicio,
      dataFim,
    });
  } else {
    agendamentos = await agendamento.getAll();
  }

  // Retornar a resposta com status 200 (OK)
  res.status(200).json(agendamentos);
}

// Handler para criar um novo agendamento
async function postHandler(req, res) {
  try {
    // Extrair os dados do corpo da requisição
    const agendamentoData = req.body;

    // Verificar se já existe agendamento com mesmas características
    // Isso evita duplicações por múltiplos envios do formulário
    const existentes = await agendamento.getFiltered({
      paciente_id: agendamentoData.paciente_id,
      terapeuta_id: agendamentoData.terapeuta_id,
      dataInicio: agendamentoData.dataAgendamento,
      dataFim: agendamentoData.dataAgendamento,
      horario: agendamentoData.horarioAgendamento,
    });

    // Se encontrou algum agendamento com os mesmos dados críticos
    if (
      existentes &&
      existentes.some(
        (a) =>
          a.horarioAgendamento === agendamentoData.horarioAgendamento &&
          a.dataAgendamento === agendamentoData.dataAgendamento &&
          a.paciente_id === agendamentoData.paciente_id &&
          a.terapeuta_id === agendamentoData.terapeuta_id,
      )
    ) {
      return res.status(409).json({
        error: "Conflito",
        message: "Já existe um agendamento com estes mesmos dados",
      });
    }

    // Criar um novo agendamento
    const novoAgendamento = await agendamento.create(agendamentoData);

    // Só criar sessão se o agendamento não estiver cancelado
    if (novoAgendamento.statusAgendamento !== "Cancelado") {
      try {
        // Mapear os campos do agendamento para os campos da sessão
        const sessaoData = {
          terapeuta_id: novoAgendamento.terapeuta_id,
          paciente_id: novoAgendamento.paciente_id,
          tipoSessao: mapearTipoAgendamentoParaTipoSessao(
            novoAgendamento.tipoAgendamento,
          ),
          valorSessao: novoAgendamento.valorAgendamento,
          statusSessao: mapearStatusAgendamentoParaStatusSessao(
            novoAgendamento.statusAgendamento,
          ),
          agendamento_id: novoAgendamento.id,
        };

        // Criar a sessão
        await sessao.create(sessaoData);
      } catch (error) {
        console.error("Erro ao criar sessão para o agendamento:", error);
        // Não falhar a criação do agendamento se houver erro na sessão
      }
    }

    res.status(201).json(novoAgendamento);
  } catch (error) {
    console.error("Erro ao criar agendamento:", error);
    res
      .status(500)
      .json({ error: "Erro interno do servidor", message: error.message });
  }
}

// Funções auxiliares (mover do arquivo /pages/api/v1/sessoes/from-agendamento.js)
function mapearTipoAgendamentoParaTipoSessao(tipoAgendamento) {
  switch (tipoAgendamento) {
    case "Sessão":
      return "Atendimento";
    case "Orientação Parental":
      return "Atendimento"; // Alterado de "Orientação" para "Atendimento"
    case "Visita Escolar":
      return "Visitar Escolar";
    case "Supervisão":
      return "Atendimento"; // Alterado de "Supervisão" para "Atendimento"
    default:
      return "Atendimento";
  }
}

function mapearStatusAgendamentoParaStatusSessao(statusAgendamento) {
  switch (statusAgendamento) {
    case "Confirmado":
      return "Pagamento Pendente";
    case "Remarcado":
      return "Pagamento Pendente";
    case "Cancelado":
      return "Pagamento Pendente"; // Não criar sessões para agendamentos cancelados
    default:
      return "Pagamento Pendente";
  }
}

// Exportar o handler com tratamento de erros
export default router.handler(controller.errorHandlers);
