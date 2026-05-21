import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import agendamento from "models/agendamento.js";
import sessao from "models/sessao.js";
import authMiddleware from "utils/authMiddleware.js";
import { requirePermission } from "utils/roleMiddleware.js";
import {
  requireTerapeutaAccess,
  terapeutaTemAcessoAgendamento,
  terapeutaTemAcessoPaciente,
} from "utils/terapeutaMiddleware.js";

// Criar o router
const router = createRouter();

const VALID_LOCAL_AGENDAMENTO = new Set([
  "Sala Verde",
  "Sala Azul",
  "Sala 321",
  "Não Precisa de Sala",
]);

// Aplicar middleware de autenticação para proteger as rotas
router.use(authMiddleware);
router.use(requirePermission("agendamentos"));
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

    const localAgendamento =
      typeof agendamentoData.localAgendamento === "string"
        ? agendamentoData.localAgendamento.trim()
        : agendamentoData.localAgendamento;

    agendamentoData.localAgendamento = localAgendamento;

    if (localAgendamento && !VALID_LOCAL_AGENDAMENTO.has(localAgendamento)) {
      return res.status(422).json({
        error: "Valor inválido",
        message: "localAgendamento inválido.",
      });
    }

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

    // O model pode retornar camelCase ou snake_case dependendo do mapeamento
    // e o update pode não atualizar ambos, então garantimos aqui
    const sessaoRealizadaDepois =
      agendamentoAtualizado.sessao_realizada !== undefined
        ? agendamentoAtualizado.sessao_realizada
        : agendamentoAtualizado.sessaoRealizada;

    const faltaDepois =
      agendamentoAtualizado.falta !== undefined
        ? agendamentoAtualizado.falta
        : false;

    const statusAgendamentoDepois = obterCampo(
      agendamentoAtualizado,
      "statusAgendamento",
      "status_agendamento",
    );
    const deveExistirSessaoDepois =
      (sessaoRealizadaDepois || faltaDepois) &&
      statusAgendamentoDepois !== "Cancelado";

    const sessoesAssociadas = await sessao.getFiltered({
      agendamento_id: id,
    });

    if (!deveExistirSessaoDepois) {
      for (const sessaoAssociada of sessoesAssociadas) {
        await sessao.remove(sessaoAssociada.id);
      }

      // Se o agendamento foi cancelado, garantir que sessaoRealizada seja false no banco
      if (statusAgendamentoDepois === "Cancelado" && sessaoRealizadaDepois) {
        await agendamento.update(id, { sessaoRealizada: false });
        // Mantém a resposta consistente com o estado persistido no banco
        agendamentoAtualizado.sessaoRealizada = false;
        agendamentoAtualizado.sessao_realizada = false;
      }
    } else if (sessoesAssociadas.length === 0) {
      const sessaoData = {
        terapeuta_id: obterCampo(
          agendamentoAtualizado,
          "terapeuta_id",
          "terapeutaId",
        ),
        paciente_id: obterCampo(
          agendamentoAtualizado,
          "paciente_id",
          "pacienteId",
        ),
        tipoSessao: mapearTipoAgendamentoParaTipoSessao(
          obterCampo(
            agendamentoAtualizado,
            "tipoAgendamento",
            "tipo_agendamento",
          ),
        ),
        valorSessao: obterNumeroCampo(
          agendamentoAtualizado,
          "valorAgendamento",
          "valor_agendamento",
        ),
        statusSessao: "Pagamento Pendente",
        agendamento_id: agendamentoAtualizado.id,
      };

      await sessao.create(sessaoData);
    } else {
      const valorAntes = obterNumeroCampo(
        agendamentoAntes,
        "valorAgendamento",
        "valor_agendamento",
      );
      const valorDepois = obterNumeroCampo(
        agendamentoAtualizado,
        "valorAgendamento",
        "valor_agendamento",
      );
      const tipoAntes = obterCampo(
        agendamentoAntes,
        "tipoAgendamento",
        "tipo_agendamento",
      );
      const tipoDepois = obterCampo(
        agendamentoAtualizado,
        "tipoAgendamento",
        "tipo_agendamento",
      );
      const terapeutaAntes = obterCampo(
        agendamentoAntes,
        "terapeuta_id",
        "terapeutaId",
      );
      const terapeutaDepois = obterCampo(
        agendamentoAtualizado,
        "terapeuta_id",
        "terapeutaId",
      );
      const pacienteAntes = obterCampo(
        agendamentoAntes,
        "paciente_id",
        "pacienteId",
      );
      const pacienteDepois = obterCampo(
        agendamentoAtualizado,
        "paciente_id",
        "pacienteId",
      );

      const sessaoUpdateData = {};

      if (valorAntes !== valorDepois) {
        sessaoUpdateData.valorSessao = valorDepois;
      }

      if (tipoAntes !== tipoDepois) {
        sessaoUpdateData.tipoSessao =
          mapearTipoAgendamentoParaTipoSessao(tipoDepois);
      }

      if (terapeutaAntes !== terapeutaDepois) {
        sessaoUpdateData.terapeuta_id = terapeutaDepois;
      }

      if (pacienteAntes !== pacienteDepois) {
        sessaoUpdateData.paciente_id = pacienteDepois;
      }

      if (Object.keys(sessaoUpdateData).length > 0) {
        for (const sessaoAssociada of sessoesAssociadas) {
          await sessao.update(sessaoAssociada.id, sessaoUpdateData);
        }
      }
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
        for (const sessaoAssociada of sessoesAssociadas) {
          await sessao.remove(sessaoAssociada.id);
        }
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

function obterCampo(obj, campoCamel, campoSnake) {
  if (!obj) return undefined;
  if (obj[campoCamel] !== undefined) return obj[campoCamel];
  return obj[campoSnake];
}

function obterNumeroCampo(obj, campoCamel, campoSnake) {
  const valor = obterCampo(obj, campoCamel, campoSnake);
  if (valor === undefined || valor === null) return valor;
  return Number(valor);
}
