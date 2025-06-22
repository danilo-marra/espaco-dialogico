// Script de teste para debugar agendamentos recorrentes
const axios = require("axios");

async function testRecurrentAppointments() {
  try {
    console.log("=== TESTE DE AGENDAMENTOS RECORRENTES ===");
    // Dados de teste com UUIDs válidos
    const testData = {
      agendamentoBase: {
        paciente_id: "550e8400-e29b-41d4-a716-446655440001", // UUID válido de teste
        terapeuta_id: "550e8400-e29b-41d4-a716-446655440002", // UUID válido de teste
        dataAgendamento: "2025-06-22",
        horarioAgendamento: "10:00",
        localAgendamento: "Sala Verde",
        modalidadeAgendamento: "Presencial",
        tipoAgendamento: "Sessão",
        valorAgendamento: 150,
        statusAgendamento: "Confirmado",
        observacoesAgendamento: "Teste de recorrência",
      },
      diasDaSemana: ["Segunda-feira", "Quarta-feira"],
      dataFimRecorrencia: "2025-07-22",
      periodicidade: "Semanal",
    };

    console.log("Dados do teste:", JSON.stringify(testData, null, 2)); // Fazer request para a API de teste
    const response = await axios.post(
      "http://localhost:3000/api/test/recurrences/test-id-123",
      testData,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000,
      },
    );

    console.log("Resposta da API:", response.data);
  } catch (error) {
    console.error("Erro no teste:", error.response?.data || error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Headers:", error.response.headers);
    }
  }
}

// Executar o teste
testRecurrentAppointments();
