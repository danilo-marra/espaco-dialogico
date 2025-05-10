import { authMiddleware } from "utils/authMiddleware";
import agendamento from "models/agendamento";
import sessao from "models/sessao";
import { NotFoundError } from "infra/errors";

// Handler principal da API
async function handler(request, response) {
  // Verificar método HTTP
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Método não permitido" });
  }

  try {
    // Extrair o ID do agendamento da requisição
    const { agendamento_id } = request.body;

    if (!agendamento_id) {
      return response.status(400).json({
        error: "ID do agendamento é obrigatório",
      });
    }

    // Buscar o agendamento pelo ID
    const agendamentoData = await agendamento.getById(agendamento_id);

    if (!agendamentoData) {
      return response.status(404).json({
        error: "Agendamento não encontrado",
      });
    }

    // Verificar se já existe uma sessão para este agendamento
    const sessoesExistentes = await sessao.getFiltered({ agendamento_id });

    // Se já existe, atualizamos a sessão existente
    if (sessoesExistentes && sessoesExistentes.length > 0) {
      const sessaoExistente = sessoesExistentes[0];

      // Preparar dados para atualização
      const dadosAtualizados = {
        terapeuta_id: agendamentoData.terapeuta_id,
        paciente_id: agendamentoData.paciente_id,
        tipoSessao: mapearTipoAgendamentoParaTipoSessao(
          agendamentoData.tipoAgendamento,
        ),
        valorSessao: agendamentoData.valorAgendamento,
        dtSessao1: agendamentoData.dataAgendamento,
        statusSessao: mapearStatusAgendamentoParaStatusSessao(
          agendamentoData.statusAgendamento,
        ),
        agendamento_id: agendamentoData.id,
      };

      // Atualizar a sessão existente
      const sessaoAtualizada = await sessao.update(
        sessaoExistente.id,
        dadosAtualizados,
      );

      return response.status(200).json({
        message: "Sessão atualizada com sucesso",
        sessao: sessaoAtualizada,
      });
    }
    // Se não existe, criamos uma nova sessão
    else {
      // Preparar dados para criação da sessão
      const sessaoData = {
        terapeuta_id: agendamentoData.terapeuta_id,
        paciente_id: agendamentoData.paciente_id,
        tipoSessao: mapearTipoAgendamentoParaTipoSessao(
          agendamentoData.tipoAgendamento,
        ),
        valorSessao: agendamentoData.valorAgendamento,
        dtSessao1: agendamentoData.dataAgendamento,
        statusSessao: mapearStatusAgendamentoParaStatusSessao(
          agendamentoData.statusAgendamento,
        ),
        agendamento_id: agendamentoData.id,
      };

      // Criar a nova sessão
      const novaSessao = await sessao.create(sessaoData);

      return response.status(201).json({
        message: "Sessão criada com sucesso",
        sessao: novaSessao,
      });
    }
  } catch (error) {
    console.error("Erro ao processar agendamento para sessão:", error);

    if (error instanceof NotFoundError) {
      return response.status(404).json({ error: error.message });
    }

    return response.status(500).json({
      error: "Erro ao processar agendamento para sessão",
      details: error.message,
    });
  }
}

// Função para mapear o tipo de agendamento para tipo de sessão
function mapearTipoAgendamentoParaTipoSessao(tipoAgendamento) {
  switch (tipoAgendamento) {
    case "Sessão":
      return "Atendimento";
    case "Orientação Parental":
      return "Orientação";
    case "Visita Escolar":
      return "Visitar Escolar";
    case "Supervisão":
      return "Supervisão";
    default:
      return "Atendimento"; // Valor padrão
  }
}

// Função para mapear o status de agendamento para status de sessão
function mapearStatusAgendamentoParaStatusSessao(statusAgendamento) {
  switch (statusAgendamento) {
    case "Confirmado":
      return "Pagamento Pendente";
    case "Remarcado":
      return "Pagamento Pendente";
    case "Cancelado":
      return "Cancelado";
    default:
      return "Pagamento Pendente"; // Valor padrão
  }
}

// Exportar o endpoint protegido por autenticação
export default authMiddleware(handler);
