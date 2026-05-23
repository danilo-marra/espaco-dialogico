import database from "infra/database.js";

function getCurrentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function normalizePeriodo(periodo) {
  if (!periodo) {
    return getCurrentPeriod();
  }

  if (!/^\d{4}-\d{2}$/.test(periodo)) {
    throw new Error("Formato de período inválido. Use YYYY-MM");
  }

  return periodo;
}

function getPeriodoRange(periodo) {
  const [ano, mes] = periodo.split("-").map(Number);
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const dataInicio = `${ano}-${String(mes).padStart(2, "0")}-01`;
  const dataFim = `${ano}-${String(mes).padStart(2, "0")}-${String(ultimoDia).padStart(2, "0")}`;
  return { dataInicio, dataFim };
}

async function obterPendencias(periodoParam) {
  const periodo = normalizePeriodo(periodoParam);
  const { dataInicio, dataFim } = getPeriodoRange(periodo);

  const pacientesACobrarResult = await database.query({
    text: `
      SELECT
        p.id AS paciente_id,
        p.nome AS paciente_nome,
        MIN(a.data_agendamento) AS proxima_data,
        COUNT(*)::int AS total_sessoes,
        STRING_AGG(DISTINCT t.nome, ', ') AS terapeutas
      FROM sessoes s
      INNER JOIN agendamentos a ON a.id = s.agendamento_id
      INNER JOIN pacientes p ON p.id = s.paciente_id
      LEFT JOIN terapeutas t ON t.id = s.terapeuta_id
      WHERE a.data_agendamento BETWEEN $1 AND $2
        AND s.pagamento_realizado = false
      GROUP BY p.id, p.nome
      ORDER BY MIN(a.data_agendamento) ASC, p.nome ASC
    `,
    values: [dataInicio, dataFim],
  });

  const notasFiscaisPendentesResult = await database.query({
    text: `
      SELECT
        p.id AS paciente_id,
        p.nome AS paciente_nome,
        MIN(a.data_agendamento) AS proxima_data,
        COUNT(*)::int AS total_sessoes,
        STRING_AGG(DISTINCT t.nome, ', ') AS terapeutas
      FROM sessoes s
      INNER JOIN agendamentos a ON a.id = s.agendamento_id
      INNER JOIN pacientes p ON p.id = s.paciente_id
      LEFT JOIN terapeutas t ON t.id = s.terapeuta_id
      WHERE a.data_agendamento BETWEEN $1 AND $2
        AND s.pagamento_realizado = true
        AND s.nota_fiscal <> 'Enviada'
      GROUP BY p.id, p.nome
      ORDER BY MIN(a.data_agendamento) ASC, p.nome ASC
    `,
    values: [dataInicio, dataFim],
  });

  const repassesPendentesResult = await database.query({
    text: `
      SELECT
        t.id AS terapeuta_id,
        t.nome AS terapeuta_nome,
        COUNT(*)::int AS total_sessoes,
        COALESCE(SUM(COALESCE(s.valor_repasse, 0)), 0)::numeric AS total_repasse
      FROM sessoes s
      INNER JOIN agendamentos a ON a.id = s.agendamento_id
      LEFT JOIN terapeutas t ON t.id = s.terapeuta_id
      WHERE a.data_agendamento BETWEEN $1 AND $2
        AND s.pagamento_realizado = true
        AND s.repasse_realizado = false
      GROUP BY t.id, t.nome
      ORDER BY COUNT(*) DESC, t.nome ASC
    `,
    values: [dataInicio, dataFim],
  });

  const marcacoesPendentesResult = await database.query({
    text: `
      SELECT
        p.id AS paciente_id,
        p.nome AS paciente_nome,
        t.nome AS terapeuta_nome,
        MAX(a.data_agendamento) AS ultima_data_agendamento
      FROM pacientes p
      LEFT JOIN terapeutas t ON t.id = p.terapeuta_id
      LEFT JOIN agendamentos a ON a.paciente_id = p.id
      WHERE NOT EXISTS (
        SELECT 1
        FROM agendamentos a2
        WHERE a2.paciente_id = p.id
          AND a2.data_agendamento BETWEEN $1 AND $2
      )
      GROUP BY p.id, p.nome, t.nome
      ORDER BY MAX(a.data_agendamento) ASC NULLS FIRST, p.nome ASC
    `,
    values: [dataInicio, dataFim],
  });

  const pacientesACobrar = pacientesACobrarResult.rows.map((row) => ({
    id: row.paciente_id,
    nome: row.paciente_nome,
    terapeutaNome: row.terapeutas || "Sem terapeuta",
    totalSessoes: row.total_sessoes,
    dataReferencia: row.proxima_data,
  }));

  const notasFiscaisPendentes = notasFiscaisPendentesResult.rows.map((row) => ({
    id: row.paciente_id,
    nome: row.paciente_nome,
    terapeutaNome: row.terapeutas || "Sem terapeuta",
    totalSessoes: row.total_sessoes,
    dataReferencia: row.proxima_data,
  }));

  const repassesPendentes = repassesPendentesResult.rows.map((row) => ({
    id: row.terapeuta_id,
    nome: row.terapeuta_nome || "Terapeuta não informado",
    totalSessoes: row.total_sessoes,
    totalRepasse: Number(row.total_repasse || 0),
  }));

  const marcacoesPendentes = marcacoesPendentesResult.rows.map((row) => ({
    id: row.paciente_id,
    nome: row.paciente_nome,
    terapeutaNome: row.terapeuta_nome || "Sem terapeuta",
    dataReferencia: row.ultima_data_agendamento,
  }));

  return {
    periodo,
    resumo: {
      pacientesACobrar: pacientesACobrar.length,
      notasFiscaisPendentes: notasFiscaisPendentes.length,
      marcacoesPendentes: marcacoesPendentes.length,
      repassesPendentes: repassesPendentes.length,
    },
    pacientesACobrar,
    notasFiscaisPendentes,
    marcacoesPendentes,
    repassesPendentes,
  };
}

const dashboardPendencias = {
  obterPendencias,
};

export default dashboardPendencias;
