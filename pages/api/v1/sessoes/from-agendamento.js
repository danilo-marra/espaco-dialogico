import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import agendamento from "models/agendamento.js";
import sessao from "models/sessao.js";
import authMiddleware from "utils/authMiddleware.js";
import { NotFoundError } from "infra/errors.js";

// Criar o router
const router = createRouter();

// Aplicar middleware de autenticação para proteger as rotas
router.use(authMiddleware);

// Definir os handlers para cada método HTTP
router.post(postHandler);

// Handler principal da API
async function postHandler(request, response) {
  try {
    // Extrair o ID do agendamento da requisição
    const { agendamento_id, update_all_recurrences } = request.body;

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

    // Se for para atualizar todas as recorrências e o agendamento tem um recurrenceId
    if (update_all_recurrences && agendamentoData.recurrenceId) {
      // Buscar todos os agendamentos da mesma recorrência
      const agendamentosRecorrentes = await agendamento.getFiltered({
        recurrenceId: agendamentoData.recurrenceId,
      });

      const sessoesAtualizadas = [];

      for (const agend of agendamentosRecorrentes) {
        // Pular agendamentos cancelados - não criar/atualizar sessões para eles
        if (agend.statusAgendamento === "Cancelado") {
          continue;
        }

        // Verificar se já existe uma sessão para este agendamento
        const sessoesExistentes = await sessao.getFiltered({
          agendamento_id: agend.id,
        });

        // Preparar dados para a sessão
        const dadosSessao = {
          terapeuta_id: agend.terapeuta_id,
          paciente_id: agend.paciente_id,
          tipoSessao: mapearTipoAgendamentoParaTipoSessao(
            agend.tipoAgendamento,
          ),
          valorSessao: agend.valorAgendamento,
          statusSessao: mapearStatusAgendamentoParaStatusSessao(
            agend.statusAgendamento,
          ),
          agendamento_id: agend.id,
        };

        if (sessoesExistentes && sessoesExistentes.length > 0) {
          // Atualizar a sessão existente
          const sessaoAtualizada = await sessao.update(
            sessoesExistentes[0].id,
            dadosSessao,
          );
          sessoesAtualizadas.push(sessaoAtualizada);
        } else {
          // Criar nova sessão
          const novaSessao = await sessao.create(dadosSessao);
          sessoesAtualizadas.push(novaSessao);
        }
      }

      return response.status(200).json({
        message: `${sessoesAtualizadas.length} sessões atualizadas/criadas com sucesso para a recorrência`,
        sessoes: sessoesAtualizadas,
      });
    }

    // Processamento para um único agendamento
    // Se o agendamento está cancelado, não criar/atualizar sessão
    if (agendamentoData.statusAgendamento === "Cancelado") {
      return response.status(200).json({
        message: "Agendamento cancelado - sessão não será criada/atualizada",
        agendamento: agendamentoData,
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
      return "Atendimento"; // Alterado para ser consistente com a API de agendamentos
    case "Visita Escolar":
      return "Visitar Escolar";
    case "Supervisão":
      return "Atendimento"; // Alterado para ser consistente com a API de agendamentos
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
    default:
      return "Pagamento Pendente"; // Valor padrão
  }
}

// Exportar o handler com tratamento de erros
export default router.handler(controller.errorHandlers);
