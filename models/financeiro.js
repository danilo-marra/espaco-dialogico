import { ValidationError } from "infra/errors.js";
import sessao from "./sessao.js";
import transacao from "./transacao.js";

// Função auxiliar para formatar data para SQL
function formatDateForSQL(date) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error("Data inválida fornecida para formatDateForSQL");
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Obter resumo financeiro por período
async function obterResumoFinanceiroPorPeriodo(periodo) {
  try {
    // Validar formato do período (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(periodo)) {
      throw new ValidationError({
        message: "Formato de período inválido. Use YYYY-MM",
      });
    }

    const [ano, mes] = periodo.split("-");
    const dataInicio = new Date(parseInt(ano), parseInt(mes) - 1, 1);
    const dataFim = new Date(parseInt(ano), parseInt(mes), 0, 23, 59, 59);

    // Buscar sessões do período
    const sessoesPeriodo = await sessao.getByPeriod(dataInicio, dataFim);

    // Calcular receita das sessões (apenas sessões com pagamento realizado)
    const sessoesPagas = sessoesPeriodo.filter((s) => s.pagamentoRealizado);
    const receitaSessoes = sessoesPagas.reduce(
      (acc, s) => acc + (s.valorSessao || 0),
      0,
    );

    // Calcular repasses dos terapeutas (apenas sessões com repasse realizado)
    const sessoesComRepasse = sessoesPeriodo.filter((s) => s.repasseRealizado);

    // Função para calcular repasse automaticamente quando não estiver definido
    const calcularValorRepasse = (sessao) => {
      // Se já tem valor definido, usar ele
      if (sessao.valorRepasse !== null && sessao.valorRepasse !== undefined) {
        return Number(sessao.valorRepasse);
      }

      // Senão, calcular baseado no tempo de casa do terapeuta
      if (sessao.terapeutaInfo?.dt_entrada && sessao.valorSessao) {
        try {
          const entrada = new Date(sessao.terapeutaInfo.dt_entrada);
          const agora = new Date();
          const mesesTrabalhando =
            (agora.getFullYear() - entrada.getFullYear()) * 12 +
            (agora.getMonth() - entrada.getMonth());

          // Regra: 45% para menos de 12 meses, 50% para 12 meses ou mais
          const percentual = mesesTrabalhando < 12 ? 0.45 : 0.5;
          return sessao.valorSessao * percentual;
        } catch (error) {
          console.warn("Erro ao calcular repasse:", error);
          // Retorna valor padrão em caso de erro (45%)
          return sessao.valorSessao * 0.45;
        }
      }

      // Valor padrão se não conseguir calcular
      return sessao.valorSessao * 0.45;
    };

    const repasseTerapeutas = sessoesComRepasse.reduce(
      (acc, s) => acc + calcularValorRepasse(s),
      0,
    );

    // Buscar transações do período
    const transacoesPeriodo = await transacao.findAll({
      dataInicial: formatDateForSQL(dataInicio),
      dataFinal: formatDateForSQL(dataFim),
    });

    // Calcular entradas e saídas manuais
    const entradasManuais = transacoesPeriodo
      .filter((t) => t.tipo === "entrada")
      .reduce((acc, t) => {
        // Tentar múltiplas formas de conversão para garantir compatibilidade
        let valor = 0;
        if (typeof t.valor === "number") {
          valor = t.valor;
        } else if (typeof t.valor === "string") {
          valor = parseFloat(t.valor.replace(",", "."));
        } else {
          valor = Number(t.valor);
        }

        if (isNaN(valor) || valor === null || valor === undefined) {
          console.warn("Valor inválido encontrado na transação entrada:", t);
          return acc;
        }
        return acc + valor;
      }, 0);

    const saidasManuais = transacoesPeriodo
      .filter((t) => t.tipo === "saida")
      .reduce((acc, t) => {
        // Tentar múltiplas formas de conversão para garantir compatibilidade
        let valor = 0;
        if (typeof t.valor === "number") {
          valor = t.valor;
        } else if (typeof t.valor === "string") {
          valor = parseFloat(t.valor.replace(",", "."));
        } else {
          valor = Number(t.valor);
        }

        if (isNaN(valor) || valor === null || valor === undefined) {
          console.warn("Valor inválido encontrado na transação saída:", t);
          return acc;
        }
        return acc + valor;
      }, 0);

    // Calcular totais
    const totalEntradas = receitaSessoes + entradasManuais;
    const totalSaidas = repasseTerapeutas + saidasManuais;
    const saldoFinal = totalEntradas - totalSaidas;

    return {
      periodo,
      receitaSessoes,
      repasseTerapeutas,
      entradasManuais,
      saidasManuais,
      totalEntradas,
      totalSaidas,
      saldoFinal,
      quantidadeSessoes: sessoesPagas.length,
    };
  } catch (error) {
    console.error("Erro ao obter resumo financeiro:", error);
    throw error;
  }
}

// Obter histórico dos últimos 6 meses
async function obterHistoricoFinanceiro() {
  try {
    const agora = new Date();
    const historico = [];

    for (let i = 5; i >= 0; i--) {
      const data = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
      const periodo = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;

      const resumo = await obterResumoFinanceiroPorPeriodo(periodo);

      // Adicionar nome do mês para exibição
      const mesNome = data.toLocaleDateString("pt-BR", {
        month: "short",
        year: "numeric",
      });

      historico.push({
        ...resumo,
        mes: mesNome,
        faturamento: resumo.totalEntradas,
        despesas: resumo.totalSaidas,
        lucro: resumo.saldoFinal,
      });
    }

    return historico;
  } catch (error) {
    console.error("Erro ao obter histórico financeiro:", error);
    throw error;
  }
}

// Obter métricas financeiras do período atual
async function obterMetricasFinanceiras() {
  try {
    const agora = new Date();
    const periodoAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;

    return await obterResumoFinanceiroPorPeriodo(periodoAtual);
  } catch (error) {
    console.error("Erro ao obter métricas financeiras:", error);
    throw error;
  }
}

// Obter comparativo mensal (mês atual vs mês anterior)
async function obterComparativoMensal() {
  try {
    const agora = new Date();
    const mesAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;

    const mesAnterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
    const periodoAnterior = `${mesAnterior.getFullYear()}-${String(mesAnterior.getMonth() + 1).padStart(2, "0")}`;

    const [atual, anterior] = await Promise.all([
      obterResumoFinanceiroPorPeriodo(mesAtual),
      obterResumoFinanceiroPorPeriodo(periodoAnterior),
    ]);

    // Calcular variações percentuais
    const calcularVariacao = (valorAtual, valorAnterior) => {
      if (valorAnterior === 0) return valorAtual > 0 ? 100 : 0;
      return ((valorAtual - valorAnterior) / valorAnterior) * 100;
    };

    return {
      atual,
      anterior,
      variacoes: {
        faturamento: calcularVariacao(
          atual.totalEntradas,
          anterior.totalEntradas,
        ),
        despesas: calcularVariacao(atual.totalSaidas, anterior.totalSaidas),
        lucro: calcularVariacao(atual.saldoFinal, anterior.saldoFinal),
        sessoes: calcularVariacao(
          atual.quantidadeSessoes,
          anterior.quantidadeSessoes,
        ),
      },
    };
  } catch (error) {
    console.error("Erro ao obter comparativo mensal:", error);
    throw error;
  }
}

// Obter resumo anual
async function obterResumoAnual(ano) {
  try {
    const anoAtual = ano || new Date().getFullYear();
    const dadosAnuais = [];

    for (let mes = 1; mes <= 12; mes++) {
      const periodo = `${anoAtual}-${String(mes).padStart(2, "0")}`;
      const resumoMes = await obterResumoFinanceiroPorPeriodo(periodo);
      dadosAnuais.push(resumoMes);
    }

    // Calcular totais anuais
    const totalAnual = dadosAnuais.reduce(
      (acc, mes) => ({
        receitaSessoes: acc.receitaSessoes + mes.receitaSessoes,
        repasseTerapeutas: acc.repasseTerapeutas + mes.repasseTerapeutas,
        entradasManuais: acc.entradasManuais + mes.entradasManuais,
        saidasManuais: acc.saidasManuais + mes.saidasManuais,
        totalEntradas: acc.totalEntradas + mes.totalEntradas,
        totalSaidas: acc.totalSaidas + mes.totalSaidas,
        saldoFinal: acc.saldoFinal + mes.saldoFinal,
        quantidadeSessoes: acc.quantidadeSessoes + mes.quantidadeSessoes,
      }),
      {
        receitaSessoes: 0,
        repasseTerapeutas: 0,
        entradasManuais: 0,
        saidasManuais: 0,
        totalEntradas: 0,
        totalSaidas: 0,
        saldoFinal: 0,
        quantidadeSessoes: 0,
      },
    );

    return {
      ano: anoAtual,
      dadosMensais: dadosAnuais,
      totalAnual,
    };
  } catch (error) {
    console.error("Erro ao obter resumo anual:", error);
    throw error;
  }
}

const financeiro = {
  obterResumoFinanceiroPorPeriodo,
  obterHistoricoFinanceiro,
  obterMetricasFinanceiras,
  obterComparativoMensal,
  obterResumoAnual,
};

export default financeiro;
