// Script de teste para verificar o histórico financeiro
const financeiroOtimizado = require("./models/financeiroOtimizado.js").default;

async function testarHistoricoFinanceiro() {
  try {
    console.log("🧪 Testando histórico financeiro...");

    // Limpar cache primeiro
    financeiroOtimizado.clearCache();

    // Buscar histórico
    const resultado =
      await financeiroOtimizado.obterHistoricoFinanceiroOtimizado();

    console.log("📊 Resultado do teste:");
    console.log("- Fonte:", resultado.source);
    console.log("- Períodos encontrados:", resultado.historico?.length || 0);

    if (resultado.historico && resultado.historico.length > 0) {
      console.log("- Primeiro período:", resultado.historico[0]);
      console.log(
        "- Último período:",
        resultado.historico[resultado.historico.length - 1],
      );

      // Verificar se há dados não-zero
      const temDados = resultado.historico.some(
        (item) => item.faturamento > 0 || item.despesas > 0,
      );
      console.log("- Tem dados financeiros:", temDados);
    } else {
      console.log("⚠️ Nenhum período encontrado no histórico");
    }
  } catch (error) {
    console.error("❌ Erro no teste:", error.message);
  }
}

testarHistoricoFinanceiro();
