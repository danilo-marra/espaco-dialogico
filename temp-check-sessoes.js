const database = require("./infra/database.js");

async function checkSessoes() {
  try {
    const result = await database.query({
      text: "SELECT tipo_sessao, valor_sessao, pagamento_realizado, nota_fiscal FROM sessoes ORDER BY created_at DESC LIMIT 5",
    });

    console.log("Últimas 5 sessões criadas:");
    result.rows.forEach((row, i) => {
      console.log(
        `${i + 1}. Tipo: ${row.tipo_sessao}, Valor: R$${row.valor_sessao}, Pagamento: ${row.pagamento_realizado}, Nota: ${row.nota_fiscal}`,
      );
    });
  } catch (error) {
    console.error("Erro:", error);
  } finally {
    process.exit(0);
  }
}

checkSessoes();
