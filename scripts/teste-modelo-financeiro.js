// Script para testar o modelo financeiro
const financeiro = require("../models/financeiro.js");

async function testarModeloFinanceiro() {
  try {
    console.log("🧪 Testando modelo financeiro...");

    // Teste 1: Obter métricas financeiras do mês atual
    console.log("\n1. Testando obterMetricasFinanceiras():");
    const metricas = await financeiro.default.obterMetricasFinanceiras();
    console.log("✅ Métricas obtidas:", metricas);

    // Teste 2: Obter histórico financeiro
    console.log("\n2. Testando obterHistoricoFinanceiro():");
    const historico = await financeiro.default.obterHistoricoFinanceiro();
    console.log("✅ Histórico obtido:", historico.length, "meses");

    // Teste 3: Obter comparativo mensal
    console.log("\n3. Testando obterComparativoMensal():");
    const comparativo = await financeiro.default.obterComparativoMensal();
    console.log("✅ Comparativo obtido:", comparativo.variacoes);

    console.log("\n🎉 Todos os testes passaram!");
  } catch (error) {
    console.error("❌ Erro durante os testes:", error);
  }
}

// Executar os testes
testarModeloFinanceiro();
