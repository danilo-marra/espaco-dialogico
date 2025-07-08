#!/usr/bin/env node

// Script para criar índices otimizados para performance do dashboard
// Execute: node scripts/otimizar-indices-dashboard.js

import financeiroOtimizado from "../models/financeiroOtimizado.js";

async function main() {
  console.log("🚀 Iniciando otimização de índices para o dashboard...");

  try {
    await financeiroOtimizado.criarIndicesOtimizados();
    console.log("✅ Índices otimizados criados com sucesso!");
    console.log("");
    console.log("📊 Índices criados:");
    console.log(
      "- idx_sessoes_data_status: Para consultas de sessões por data e status",
    );
    console.log(
      "- idx_sessoes_pagamento: Para consultas de pagamentos e repasses",
    );
    console.log(
      "- idx_transacoes_data_tipo: Para consultas de transações por data e tipo",
    );
    console.log(
      "- idx_terapeutas_entrada: Para cálculo de repasses baseado no tempo de casa",
    );
    console.log("");
    console.log("🎯 Benefícios esperados:");
    console.log(
      "- Redução significativa no tempo de resposta das APIs financeiras",
    );
    console.log("- Carregamento mais rápido dos gráficos do dashboard");
    console.log("- Menor uso de CPU e memória no banco de dados");
    console.log("");
    console.log("⚡ Próximos passos:");
    console.log("1. Monitore os logs de performance no dashboard");
    console.log(
      "2. Use o endpoint /api/v1/dashboard/financeiro-otimizado para APIs mais rápidas",
    );
    console.log(
      "3. Considere implementar cache em Redis para ambientes de alta escala",
    );
  } catch (error) {
    console.error("❌ Erro ao criar índices otimizados:", error);
    process.exit(1);
  }

  process.exit(0);
}

// Tratar sinais para limpeza adequada
process.on("SIGINT", () => {
  console.log("\n🛑 Processo interrompido pelo usuário");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Processo terminado");
  process.exit(0);
});

main().catch((error) => {
  console.error("💥 Erro fatal:", error);
  process.exit(1);
});
