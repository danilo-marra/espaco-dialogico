import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import agendamento from "models/agendamento.js";
import sessao from "models/sessao.js";
import authMiddleware from "utils/authMiddleware.js";

// Criar o router
const router = createRouter();

// Aplicar middleware de autenticação
router.use(authMiddleware);

// Definir os handlers para cada método HTTP
router.post(postHandler);

// Exportar o handler com tratamento de erros
export default router.handler(controller.errorHandlers);

// Handler para converter agendamento em sessão
async function postHandler(request, response) {
  try {
    const { agendamentoId } = request.body;

    if (!agendamentoId) {
      return response.status(400).json({
        error: "ID do agendamento é obrigatório",
      });
    }

    // Buscar o agendamento pelo ID
    const agendamentoData = await agendamento.getById(agendamentoId);

    if (!agendamentoData) {
      return response.status(404).json({
        error: "Agendamento não encontrado",
      });
    }

    // Verificar se já existe uma sessão para este agendamento
    let sessaoExistente = null;
    try {
      // Tentar buscar uma sessão com o agendamento_id
      const sessoes = await sessao.getFiltered({
        agendamento_id: agendamentoId,
      });
      if (sessoes && sessoes.length > 0) {
        sessaoExistente = sessoes[0];
      }
    } catch (error) {
      console.log("Nenhuma sessão existente encontrada para este agendamento");
    }

    // Mapear tipos de agendamento para tipos de sessão
    const tipoSessaoMap = {
      Sessão: "Atendimento",
      "Orientação Parental": "Atendimento",
      "Visita Escolar": "Visitar Escolar",
      Supervisão: "Atendimento",
      Outros: "Atendimento",
    };

    // Status de agendamento para status de sessão
    const statusSessaoMap = {
      Confirmado: "Pagamento Pendente",
      Remarcado: "Pagamento Pendente",
      Cancelado: "Pagamento Pendente", // Obs: talvez precise de um status "Cancelado" para sessões
    };

    // Converter o agendamento para o formato de sessão
    const sessaoData = {
      terapeuta_id: agendamentoData.terapeuta_id,
      paciente_id: agendamentoData.paciente_id,
      tipoSessao:
        tipoSessaoMap[agendamentoData.tipoAgendamento] || "Atendimento",
      valorSessao: agendamentoData.valorAgendamento || 0,
      statusSessao:
        statusSessaoMap[agendamentoData.statusAgendamento] ||
        "Pagamento Pendente",
      dtSessao1: agendamentoData.dataAgendamento,
      agendamento_id: agendamentoData.id, // Relacionar a sessão ao agendamento
    };

    let result;

    // Se já existe uma sessão, atualizá-la
    if (sessaoExistente) {
      result = await sessao.update(sessaoExistente.id, {
        ...sessaoData,
        // Preserva outros campos que não estão sendo atualizados
        dtSessao2: sessaoExistente.dtSessao2,
        dtSessao3: sessaoExistente.dtSessao3,
        dtSessao4: sessaoExistente.dtSessao4,
        dtSessao5: sessaoExistente.dtSessao5,
        dtSessao6: sessaoExistente.dtSessao6,
        valorRepasse: sessaoExistente.valorRepasse,
      });
    }
    // Se não existe, criar uma nova sessão
    else {
      result = await sessao.create(sessaoData);
    }

    return response.status(200).json({
      message: sessaoExistente
        ? "Sessão atualizada com sucesso"
        : "Sessão criada com sucesso",
      sessao: result,
    });
  } catch (error) {
    console.error("Erro ao converter agendamento para sessão:", error);
    return response.status(500).json({
      error:
        error.message ||
        "Erro ao processar a conversão de agendamento para sessão",
    });
  }
}
