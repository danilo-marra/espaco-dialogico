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

    // Buscar o estado do agendamento *antes* da atualização
    const agendamentoAntes = await agendamento.getById(id);

    // Atualizar apenas este agendamento específico
    const agendamentoAtualizado = await agendamento.update(id, agendamentoData);

    // Suporte a ambos os formatos camelCase e snake_case
    // Prioriza o valor do banco (snake_case), mas aceita camelCase vindo do frontend
    const sessaoRealizadaAntes =
      agendamentoAntes.sessao_realizada !== undefined
        ? agendamentoAntes.sessao_realizada
        : agendamentoAntes.sessaoRealizada;

    // O model pode retornar camelCase ou snake_case dependendo do mapeamento
    // e o update pode não atualizar ambos, então garantimos aqui
    const sessaoRealizadaDepois =
      agendamentoAtualizado.sessao_realizada !== undefined
        ? agendamentoAtualizado.sessao_realizada
        : agendamentoAtualizado.sessaoRealizada;

    // Se `sessaoRealizada` mudou de false para true E não está cancelado, criar a sessão
    if (
      !sessaoRealizadaAntes &&
      sessaoRealizadaDepois &&
      agendamentoAtualizado.statusAgendamento !== "Cancelado"
    ) {
      try {
        const sessaoData = {
          terapeuta_id: agendamentoAtualizado.terapeuta_id,
          paciente_id: agendamentoAtualizado.paciente_id,
          tipoSessao: mapearTipoAgendamentoParaTipoSessao(
            agendamentoAtualizado.tipoAgendamento,
          ),
          valorSessao: agendamentoAtualizado.valorAgendamento,
          statusSessao: "Pagamento Pendente",
          agendamento_id: agendamentoAtualizado.id,
        };
        await sessao.create(sessaoData);
      } catch (error) {
        console.error(
          "Erro ao criar sessão na atualização do agendamento:",
          error,
        );
      }
    }
    // Se `sessaoRealizada` mudou de true para false OU se o status mudou para "Cancelado", remover a sessão associada
    else if (
      (sessaoRealizadaAntes && !sessaoRealizadaDepois) ||
      agendamentoAtualizado.statusAgendamento === "Cancelado"
    ) {
      try {
        const sessoesAssociadas = await sessao.getFiltered({
          agendamento_id: id,
        });
        for (const sessaoAssociada of sessoesAssociadas) {
          await sessao.remove(sessaoAssociada.id);
        }

        // Se o agendamento foi cancelado, garantir que sessaoRealizada seja false no banco
        if (agendamentoAtualizado.statusAgendamento === "Cancelado") {
          console.log(
            "Agendamento cancelado - removendo sessões e desmarcando sessaoRealizada",
          );
          await agendamento.update(id, { sessaoRealizada: false });
        }
      } catch (error) {
        console.error(
          "Erro ao remover sessão na atualização do agendamento:",
          error,
        );
      }
    }

    // Retornar a resposta com status 200 (OK)
    console.log("Agendamento atualizado (backend):", agendamentoAtualizado);
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
