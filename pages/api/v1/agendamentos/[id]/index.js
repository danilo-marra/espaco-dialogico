import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import agendamento from "models/agendamento.js";
import sessao from "models/sessao.js";
import authMiddleware from "utils/authMiddleware.js";
import {
  requireTerapeutaAccess,
  terapeutaTemAcessoAgendamento,
  terapeutaTemAcessoPaciente,
} from "utils/terapeutaMiddleware.js";

// Criar o router
const router = createRouter();

// Aplicar middleware de autenticação para proteger as rotas
router.use(authMiddleware);
router.use(requireTerapeutaAccess());

// Definir os handlers para cada método HTTP
router.get(getHandler);
router.put(putHandler);
router.delete(deleteHandler);

// Handler para obter um agendamento específico
async function getHandler(req, res) {
  try {
    // Obter o ID do agendamento a partir da URL
    const { id } = req.query;

    // ALTERADO: Terapeutas podem visualizar qualquer agendamento
    // A restrição de edição é mantida nas operações PUT/DELETE

    // Buscar o agendamento pelo ID
    const agendamentoFound = await agendamento.getById(id);

    // Retornar a resposta com status 200 (OK)
    res.status(200).json(agendamentoFound);
  } catch (error) {
    console.error("Erro ao buscar agendamento:", error);
    res.status(404).json({
      message: "Agendamento não encontrado",
      error: error.message,
    });
  }
}

// Handler para atualizar um agendamento
async function putHandler(req, res) {
  try {
    // Obter o ID do agendamento a partir da URL
    const { id } = req.query;

    // Extrair os dados do corpo da requisição
    const agendamentoData = req.body;

    const userRole = req.user.role || "terapeuta";
    const currentTerapeutaId = req.terapeutaId;

    // Para terapeutas, verificar se tem acesso ao agendamento
    if (userRole === "terapeuta") {
      const temAcesso = await terapeutaTemAcessoAgendamento(
        currentTerapeutaId,
        id,
      );

      if (!temAcesso) {
        return res.status(403).json({
          error: "Acesso negado",
          message: "Você só pode editar seus próprios agendamentos",
        });
      }

      // Garantir que o terapeuta não possa alterar o terapeuta_id para outro terapeuta
      // mas manter o valor correto para a atualização
      agendamentoData.terapeuta_id = currentTerapeutaId;

      // Se o paciente_id foi alterado, verificar se o novo paciente pertence ao terapeuta
      if (agendamentoData.paciente_id) {
        const temAcessoPaciente = await terapeutaTemAcessoPaciente(
          currentTerapeutaId,
          agendamentoData.paciente_id,
        );

        if (!temAcessoPaciente) {
          return res.status(403).json({
            error: "Acesso negado",
            message:
              "Você só pode atribuir pacientes que estão sob sua responsabilidade",
          });
        }
      }
    }

    // Verificar se é para atualizar todos os agendamentos da recorrência
    const updateAllRecurrences = agendamentoData.updateAllRecurrences === true;

    // Se o agendamento faz parte de uma recorrência e a flag updateAllRecurrences está ativa
    if (updateAllRecurrences && agendamentoData.recurrenceId) {
      // Redirecionar para a API de recorrências
      return res.redirect(
        307,
        `/api/v1/agendamentos/recurrences/${agendamentoData.recurrenceId}`,
      );
    }

    // Remove a flag que não deve ser persistida no banco
    delete agendamentoData.updateAllRecurrences;

    // Atualizar apenas este agendamento específico
    const agendamentoAtualizado = await agendamento.update(id, agendamentoData);

    // Atualizar sessão associada se existir
    try {
      const sessoesAssociadas = await sessao.getFiltered({
        agendamento_id: id,
      });

      if (sessoesAssociadas && sessoesAssociadas.length > 0) {
        console.log("🔄 Atualizando sessão associada ao agendamento...");

        for (const sessaoAssociada of sessoesAssociadas) {
          // Preparar dados para atualização da sessão
          const sessaoUpdateData = {};

          // Mapear campos do agendamento para a sessão se foram alterados
          if (agendamentoData.tipoAgendamento) {
            sessaoUpdateData.tipoSessao = mapearTipoAgendamentoParaTipoSessao(
              agendamentoData.tipoAgendamento,
            );
          }

          if (agendamentoData.valorAgendamento !== undefined) {
            sessaoUpdateData.valorSessao = agendamentoData.valorAgendamento;
          }

          if (agendamentoData.statusAgendamento) {
            sessaoUpdateData.statusSessao =
              mapearStatusAgendamentoParaStatusSessao(
                agendamentoData.statusAgendamento,
              );
          }

          // Se há dados para atualizar, fazer a atualização
          if (Object.keys(sessaoUpdateData).length > 0) {
            await sessao.update(sessaoAssociada.id, sessaoUpdateData);
            console.log("✅ Sessão atualizada com sucesso");
          }
        }
      }
    } catch (error) {
      console.error("⚠️ Erro ao atualizar sessão associada:", error.message);
      // Não falhar a atualização do agendamento se houver erro na sessão
    }

    // Retornar a resposta com status 200 (OK)
    res.status(200).json(agendamentoAtualizado);
  } catch (error) {
    console.error("Erro ao atualizar agendamento:", error);
    res.status(500).json({
      message: "Erro ao atualizar agendamento",
      error: error.message,
    });
  }
}

// Handler para excluir um agendamento
async function deleteHandler(req, res) {
  try {
    // Obter o ID do agendamento a partir da URL
    const { id } = req.query;

    const userRole = req.user.role || "terapeuta";
    const currentTerapeutaId = req.terapeutaId;

    // Para terapeutas, verificar se tem acesso ao agendamento
    if (userRole === "terapeuta") {
      const temAcesso = await terapeutaTemAcessoAgendamento(
        currentTerapeutaId,
        id,
      );

      if (!temAcesso) {
        return res.status(403).json({
          error: "Acesso negado",
          message: "Você só pode excluir seus próprios agendamentos",
        });
      }
    }

    // Excluir sessões associadas primeiro
    try {
      const sessoesAssociadas = await sessao.getFiltered({
        agendamento_id: id,
      });

      if (sessoesAssociadas && sessoesAssociadas.length > 0) {
        console.log("🗑️ Excluindo sessões associadas ao agendamento...");

        for (const sessaoAssociada of sessoesAssociadas) {
          await sessao.remove(sessaoAssociada.id);
        }

        console.log(
          `✅ ${sessoesAssociadas.length} sessões excluídas com sucesso`,
        );
      }
    } catch (error) {
      console.error("⚠️ Erro ao excluir sessões associadas:", error.message);
      // Continuar com a exclusão do agendamento mesmo se houver erro nas sessões
    }

    // Excluir o agendamento
    await agendamento.remove(id);

    // Retornar a resposta com status 200 (OK)
    res.status(200).json({ message: "Agendamento excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir agendamento:", error);
    res.status(500).json({
      message: "Erro ao excluir agendamento",
      error: error.message,
    });
  }
}

// Exportar o handler com tratamento de erros
export default router.handler(controller.errorHandlers);

// Função auxiliar para mapear tipos de agendamento para tipos de sessão
function mapearTipoAgendamentoParaTipoSessao(tipoAgendamento) {
  switch (tipoAgendamento) {
    case "Sessão":
      return "Atendimento";
    case "Orientação Parental":
      return "Atendimento";
    case "Visita Escolar":
      return "Visitar Escolar";
    case "Supervisão":
      return "Atendimento";
    case "Outros":
      return "Atendimento";
    default:
      return "Atendimento";
  }
}

// Função auxiliar para mapear status de agendamento para status de sessão
function mapearStatusAgendamentoParaStatusSessao(statusAgendamento) {
  switch (statusAgendamento) {
    case "Confirmado":
      return "Pagamento Pendente";
    case "Remarcado":
      return "Pagamento Pendente";
    default:
      return "Pagamento Pendente";
  }
}
