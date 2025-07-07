// Script para testar o modelo financeiro
import financeiro from "../models/financeiro.js";

async function testarModeloFinanceiro() {
  try {
    console.log("🧪 Testando modelo financeiro...");

    // Teste 1: Obter métricas financeiras do mês atual
    console.log("\n1. Testando obterMetricasFinanceiras():");
    const metricas = await financeiro.obterMetricasFinanceiras();
    console.log("✅ Métricas obtidas:", JSON.stringify(metricas, null, 2));

    console.log("\n🎉 Teste básico passou!");
  } catch (error) {
    console.error("❌ Erro durante os testes:", error);
  }
}

// Executar os testes
testarModeloFinanceiro();
