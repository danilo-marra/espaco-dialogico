import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import agendamento from "models/agendamento.js";
import withTimeout from "utils/withTimeout.js";

// Criar o router - SEM middleware de autenticação para teste
const router = createRouter();

// Definir apenas o handler POST para teste
router.post(postHandler);

// Handler para criar agendamentos recorrentes (versão de teste sem auth)
async function postHandler(req, res) {
  const startTime = Date.now();

  try {
    const { id: recurrenceId } = req.query;
    const { agendamentoBase, diasDaSemana, dataFimRecorrencia, periodicidade } =
      req.body;

    // Debug: Log dos dados recebidos
    console.log("=== DADOS RECEBIDOS NA API (TESTE) ===");
    console.log("recurrenceId:", recurrenceId);
    console.log("agendamentoBase:", JSON.stringify(agendamentoBase, null, 2));
    console.log("diasDaSemana:", diasDaSemana);
    console.log("dataFimRecorrencia:", dataFimRecorrencia);
    console.log("periodicidade:", periodicidade);
    console.log("===============================");

    // Validar os dados necessários
    if (
      !agendamentoBase ||
      !diasDaSemana ||
      !dataFimRecorrencia ||
      !periodicidade
    ) {
      return res.status(400).json({
        message: "Dados incompletos para criação de agendamentos recorrentes",
      });
    }

    // Verificar especificamente se terapeuta_id existe
    if (!agendamentoBase.terapeuta_id) {
      console.error("ERRO: terapeuta_id não encontrado no agendamentoBase");
      return res.status(400).json({
        message: "terapeuta_id é obrigatório no agendamentoBase",
      });
    }

    if (!agendamentoBase.paciente_id) {
      console.error("ERRO: paciente_id não encontrado no agendamentoBase");
      return res.status(400).json({
        message: "paciente_id é obrigatório no agendamentoBase",
      });
    }

    // Validações adicionais para evitar timeout
    if (!Array.isArray(diasDaSemana) || diasDaSemana.length === 0) {
      return res.status(400).json({
        message: "Pelo menos um dia da semana deve ser selecionado",
      });
    }

    // Validar período para evitar criação excessiva de agendamentos
    const dataInicio = new Date(agendamentoBase.dataAgendamento);
    const dataFim = new Date(dataFimRecorrencia);
    const diferencaDias = Math.ceil(
      (dataFim - dataInicio) / (1000 * 60 * 60 * 24),
    );

    if (diferencaDias > 365) {
      return res.status(400).json({
        message: "Período de recorrência muito longo. Máximo permitido: 1 ano",
      });
    }

    console.log(
      `Iniciando criação de agendamentos recorrentes. Período: ${diferencaDias} dias`,
    );

    // VERSÃO DE TESTE: não criar agendamentos reais, apenas simular
    console.log("=== SIMULAÇÃO DE CRIAÇÃO ===");

    // Simular a criação dos agendamentos recorrentes para ver onde falha
    try {
      const simulatedResult = await agendamento.createRecurrences({
        recurrenceId,
        agendamentoBase,
        diasDaSemana,
        dataFimRecorrencia,
        periodicidade,
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`Agendamentos criados em ${duration}ms`);

      // Retornar a resposta com status 201 (Created) e os agendamentos criados
      return res.status(201).json({
        message: `${simulatedResult.length} agendamentos recorrentes criados com sucesso`,
        data: simulatedResult,
        metadata: {
          duration: `${duration}ms`,
          count: simulatedResult.length,
        },
      });
    } catch (createError) {
      console.error("Erro durante createRecurrences:", createError);
      throw createError;
    }
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.error(
      `Erro ao criar agendamentos recorrentes após ${duration}ms:`,
      error,
    );

    return res.status(500).json({
      message: "Erro ao criar agendamentos recorrentes",
      error: error.message,
      metadata: {
        duration: `${duration}ms`,
      },
    });
  }
}

// Exportar o handler com tratamento de erros e timeout
export default withTimeout(router.handler(controller.errorHandlers), 25000);
