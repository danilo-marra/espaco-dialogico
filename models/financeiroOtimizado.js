import database from "infra/database.js";

// Otimizações para o modelo financeiro - performance de consultas
// Este arquivo contém versões otimizadas das funções do modelo financeiro

// Cache em memória para consultas frequentes (válido por 5 minutos)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

function getCacheKey(type, params) {
  return `${type}:${JSON.stringify(params)}`;
}

function setCache(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

function getCache(key) {
  const cached = cache.get(key);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  return cached.data;
}

// Limpeza periódica do cache
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}, CACHE_TTL);

// Função otimizada para obter resumo financeiro com consulta única
async function obterResumoFinanceiroOtimizado(periodo) {
  const cacheKey = getCacheKey("resumo-v3", { periodo });
  const cached = getCache(cacheKey);
  if (cached) return { ...cached, source: "cache" };

  if (!/^\d{4}-\d{2}$/.test(periodo)) {
    throw new Error("Formato de período inválido. Use YYYY-MM");
  }

  const [ano, mes] = periodo.split("-");
  const dataInicio = `${ano}-${String(mes).padStart(2, "0")}-01`;

  // Calcular último dia do mês corretamente
  const ultimoDia = new Date(parseInt(ano), parseInt(mes), 0).getDate();
  const dataFim = `${ano}-${String(mes).padStart(2, "0")}-${String(ultimoDia).padStart(2, "0")}`;

  const client = await database.getNewClient();

  try {
    // Consulta para sessões do período
    const sessoesQuery = `
      SELECT 
        s.valor_sessao,
        s.valor_repasse,
        s.pagamento_realizado,
        s.repasse_realizado,
        t.dt_entrada as terapeuta_entrada
      FROM sessoes s
      LEFT JOIN terapeutas t ON s.terapeuta_id = t.id
      LEFT JOIN agendamentos a ON s.agendamento_id = a.id
      WHERE a.data_agendamento BETWEEN $1 AND $2
    `;

    const sessoesResult = await client.query(sessoesQuery, [
      dataInicio,
      dataFim,
    ]);

    // Consulta para transações do período
    const transacoesQuery = `
      SELECT
        SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END) as "entradasManuais",
        SUM(CASE WHEN tipo = 'saida' THEN valor ELSE 0 END) as "saidasManuais"
      FROM transacoes
      WHERE data BETWEEN $1 AND $2
    `;
    const transacoesResult = await client.query(transacoesQuery, [
      dataInicio,
      dataFim,
    ]);

    const sessoes = sessoesResult.rows;
    const { entradasManuais, saidasManuais } = transacoesResult.rows[0] || {
      entradasManuais: 0,
      saidasManuais: 0,
    };

    // Lógica de cálculo movida para o JS, mas com dados pré-filtrados do DB
    const receitaSessoes = sessoes
      .filter((s) => s.pagamento_realizado)
      .reduce((acc, s) => acc + (parseFloat(s.valor_sessao) || 0), 0);

    const quantidadeSessoes = sessoes.filter(
      (s) => s.pagamento_realizado,
    ).length;

    const repasseTerapeutas = sessoes
      .filter((s) => s.repasse_realizado)
      .reduce((acc, s) => {
        let valorRepasse = parseFloat(s.valor_repasse);
        if (!valorRepasse && s.terapeuta_entrada && s.valor_sessao) {
          const entrada = new Date(s.terapeuta_entrada);
          const agora = new Date();
          const mesesTrabalhando =
            (agora.getFullYear() - entrada.getFullYear()) * 12 +
            (agora.getMonth() - entrada.getMonth());
          const percentual = mesesTrabalhando < 12 ? 0.45 : 0.5;
          valorRepasse = parseFloat(s.valor_sessao) * percentual;
        }
        return acc + (valorRepasse || 0);
      }, 0);

    const totalEntradas = receitaSessoes + parseFloat(entradasManuais);
    const totalSaidas = repasseTerapeutas + parseFloat(saidasManuais);
    const saldoFinal = totalEntradas - totalSaidas;

    const resultado = {
      periodo,
      receitaSessoes: Number(receitaSessoes.toFixed(2)),
      repasseTerapeutas: Number(repasseTerapeutas.toFixed(2)),
      entradasManuais: Number(parseFloat(entradasManuais).toFixed(2)),
      saidasManuais: Number(parseFloat(saidasManuais).toFixed(2)),
      totalEntradas: Number(totalEntradas.toFixed(2)),
      totalSaidas: Number(totalSaidas.toFixed(2)),
      saldoFinal: Number(saldoFinal.toFixed(2)),
      quantidadeSessoes,
      source: "database",
    };

    setCache(cacheKey, resultado);
    return resultado;
  } catch (error) {
    console.error("Erro ao obter resumo financeiro otimizado (v3):", error);
    throw error;
  } finally {
    await client.end();
  }
}

// Função otimizada para histórico financeiro (batch processing)
async function obterHistoricoFinanceiroOtimizado() {
  const cacheKey = getCacheKey("historico-v3", {});
  const cached = getCache(cacheKey);
  if (cached) return { ...cached, source: "cache" };

  const client = await database.getNewClient();

  try {
    const agora = new Date();
    const dataInicioHistorico = new Date(
      agora.getFullYear(),
      agora.getMonth() - 5,
      1,
    );
    const dataInicio = `${dataInicioHistorico.getFullYear()}-${String(dataInicioHistorico.getMonth() + 1).padStart(2, "0")}-01`;

    // Query otimizada com dados reais separados por período
    const query = `
      WITH meses AS (
        SELECT 
          generate_series(
            date_trunc('month', $1::date),
            date_trunc('month', now()),
            '1 month'::interval
          )::date AS mes_inicio
      ),
      sessoes_por_mes AS (
        SELECT 
          date_trunc('month', a.data_agendamento)::date as mes,
          SUM(CASE WHEN s.pagamento_realizado = true THEN s.valor_sessao ELSE 0 END) as receita_sessoes,
          SUM(CASE WHEN s.repasse_realizado = true THEN 
            COALESCE(s.valor_repasse, 
              CASE 
                WHEN t.dt_entrada IS NOT NULL AND s.valor_sessao IS NOT NULL THEN
                  s.valor_sessao * (
                    CASE 
                      WHEN EXTRACT(YEAR FROM AGE(now(), t.dt_entrada)) * 12 + 
                           EXTRACT(MONTH FROM AGE(now(), t.dt_entrada)) < 12 
                      THEN 0.45 
                      ELSE 0.5 
                    END
                  )
                ELSE 0
              END
            )
          ELSE 0 END) as repasse_terapeutas
        FROM agendamentos a
        INNER JOIN sessoes s ON s.agendamento_id = a.id
        LEFT JOIN terapeutas t ON s.terapeuta_id = t.id
        WHERE a.status_agendamento = 'realizada'
          AND a.data_agendamento >= $1
        GROUP BY date_trunc('month', a.data_agendamento)::date
      ),
      transacoes_por_mes AS (
        SELECT 
          date_trunc('month', data)::date as mes,
          SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END) as entradas_manuais,
          SUM(CASE WHEN tipo = 'saida' THEN valor ELSE 0 END) as saidas_manuais
        FROM transacoes
        WHERE data >= $1
        GROUP BY date_trunc('month', data)::date
      )
      SELECT 
        TO_CHAR(m.mes_inicio, 'YYYY-MM') as periodo,
        TO_CHAR(m.mes_inicio, 'Mon/YYYY') as mes_formatado,
        COALESCE(s.receita_sessoes, 0) as receita_sessoes,
        COALESCE(s.repasse_terapeutas, 0) as repasse_terapeutas,
        COALESCE(t.entradas_manuais, 0) as entradas_manuais,
        COALESCE(t.saidas_manuais, 0) as saidas_manuais,
        (COALESCE(s.receita_sessoes, 0) + COALESCE(t.entradas_manuais, 0)) as faturamento,
        (COALESCE(s.repasse_terapeutas, 0) + COALESCE(t.saidas_manuais, 0)) as despesas,
        (COALESCE(s.receita_sessoes, 0) + COALESCE(t.entradas_manuais, 0)) - 
        (COALESCE(s.repasse_terapeutas, 0) + COALESCE(t.saidas_manuais, 0)) as lucro
      FROM meses m
      LEFT JOIN sessoes_por_mes s ON m.mes_inicio = s.mes
      LEFT JOIN transacoes_por_mes t ON m.mes_inicio = t.mes
      ORDER BY m.mes_inicio;
    `;

    const result = await client.query(query, [dataInicio]);

    const historico = result.rows.map((row) => ({
      periodo: row.periodo,
      mes: row.mes_formatado,
      faturamento: Number(parseFloat(row.faturamento || 0).toFixed(2)),
      despesas: Number(parseFloat(row.despesas || 0).toFixed(2)),
      lucro: Number(parseFloat(row.lucro || 0).toFixed(2)),
      receita_sessoes: Number(parseFloat(row.receita_sessoes || 0).toFixed(2)),
      repasse_terapeutas: Number(
        parseFloat(row.repasse_terapeutas || 0).toFixed(2),
      ),
      entradas_manuais: Number(
        parseFloat(row.entradas_manuais || 0).toFixed(2),
      ),
      saidas_manuais: Number(parseFloat(row.saidas_manuais || 0).toFixed(2)),
    }));

    const resultado = { historico, source: "database" };
    setCache(cacheKey, resultado);
    return resultado;
  } catch (error) {
    console.error("Erro ao obter histórico financeiro otimizado (v3):", error);
    throw error;
  } finally {
    await client.end();
  }
}

// Função para criar índices otimizados (executar uma vez)
async function criarIndicesOtimizados() {
  const client = await database.getNewClient();

  try {
    await client.query("BEGIN");

    // Remover índice antigo e incorreto, se existir
    await client.query(`DROP INDEX IF EXISTS idx_sessoes_data_status;`);

    // Índices para agendamentos (corrigido)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_agendamentos_data_status_realizada
      ON agendamentos(data_agendamento, status_agendamento)
      WHERE status_agendamento = 'realizada'
    `);

    // Índices para sessões
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sessoes_pagamento 
      ON sessoes(pagamento_realizado, repasse_realizado) 
      WHERE pagamento_realizado = true OR repasse_realizado = true
    `);

    // Índices para transações
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_transacoes_data_tipo 
      ON transacoes(data, tipo)
    `);

    // Índice para terapeutas
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_terapeutas_entrada 
      ON terapeutas(dt_entrada)
    `);

    await client.query("COMMIT");
    console.log("Índices otimizados criados com sucesso");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erro ao criar índices otimizados:", error);
  } finally {
    client.end();
  }
}

const financeiroOtimizado = {
  obterResumoFinanceiroOtimizado,
  obterHistoricoFinanceiroOtimizado,
  criarIndicesOtimizados,
  clearCache: () => {
    cache.clear();
    console.log("🧹 Cache do financeiro otimizado limpo");
  },
  // Função para debug - verificar dados no cache
  debugCache: () => {
    console.log("📋 Cache atual:", Array.from(cache.keys()));
    return Array.from(cache.entries()).map(([key, value]) => ({
      key,
      timestamp: new Date(value.timestamp).toISOString(),
      hasData: !!value.data,
    }));
  },
};

export default financeiroOtimizado;
