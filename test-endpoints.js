// Script de teste para verificar os endpoints do dashboard
const axios = require("axios");

const BASE_URL = "http://localhost:3000/api/v1";

async function testEndpoints() {
  console.log("🧪 Testando endpoints do dashboard...\n");

  try {
    // Teste 1: Endpoint de dados financeiros para o período atual
    console.log("📊 Testando endpoint financeiro para julho/2025...");
    const financeiro = await axios.get(
      `${BASE_URL}/dashboard/financeiro-otimizado?periodo=2025-07`,
    );
    console.log("✅ Endpoint financeiro funcionando!");
    console.log("📈 Dados recebidos:", {
      periodo: financeiro.data.periodo,
      totalEntradas: financeiro.data.totalEntradas,
      totalSaidas: financeiro.data.totalSaidas,
      saldoFinal: financeiro.data.saldoFinal,
      quantidadeSessoes: financeiro.data.quantidadeSessoes,
    });
    console.log("");

    // Teste 2: Endpoint de histórico financeiro
    console.log("📈 Testando endpoint de histórico financeiro...");
    const historico = await axios.get(
      `${BASE_URL}/dashboard/financeiro-otimizado?historico=true`,
    );
    console.log("✅ Endpoint de histórico funcionando!");
    console.log("📊 Dados do histórico:");
    historico.data.slice(0, 3).forEach((item, index) => {
      console.log(
        `  ${index + 1}. ${item.mes}: Faturamento R$ ${item.faturamento}, Despesas R$ ${item.despesas}, Lucro R$ ${item.lucro}`,
      );
    });
    console.log("");

    console.log(
      "🎉 Todos os testes passaram! Dashboard está funcionando corretamente.",
    );
  } catch (error) {
    console.error("❌ Erro nos testes:", error.response?.data || error.message);
    console.error("Status:", error.response?.status);
    console.error("URL:", error.config?.url);
  }
}

testEndpoints();
