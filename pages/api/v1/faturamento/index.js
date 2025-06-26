import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import { requireTerapeutaAccess } from "utils/terapeutaMiddleware.js";
import database from "infra/database.js";
import { format } from "date-fns";

const router = createRouter();

router.use(requireTerapeutaAccess());
router.get(getHandler);

async function getHandler(req, res) {
  try {
    const userRole = req.user.role;
    const terapeutaId = req.terapeutaId;
    const { periodo } = req.query; // formato: "2024-01"

    let whereClause = "";
    let values = [];

    // Filtro por período (se especificado)
    if (periodo) {
      whereClause +=
        " AND DATE_TRUNC('month', a.data_agendamento) = DATE_TRUNC('month', $1::date)";
      values.push(`${periodo}-01`);
    }

    // Aplicar filtro de terapeuta baseado na role
    if (userRole === "terapeuta" && terapeutaId) {
      const paramIndex = values.length + 1;
      whereClause += ` AND s.terapeuta_id = $${paramIndex}`;
      values.push(terapeutaId);
    }

    // Filtro opcional por terapeuta específico (para admin/secretaria)
    if (req.query.terapeutaId && req.query.terapeutaId !== "Todos") {
      const paramIndex = values.length + 1;
      whereClause += ` AND s.terapeuta_id = $${paramIndex}`;
      values.push(req.query.terapeutaId);
    }

    // Filtro opcional por nome do paciente
    if (req.query.paciente) {
      const paramIndex = values.length + 1;
      whereClause += ` AND LOWER(p.nome) LIKE LOWER($${paramIndex})`;
      values.push(`%${req.query.paciente}%`);
    }

    const query = `
      SELECT 
        s.id as sessao_id,
        s.valor_sessao,
        s.valor_repasse,
        s.tipo_sessao,
        s.status_sessao,
        
        a.data_agendamento,
        a.horario_agendamento,
        a.modalidade_agendamento,
        
        p.nome as paciente_nome,
        
        t.nome as terapeuta_nome,
        t.dt_entrada as terapeuta_dt_entrada
        
      FROM sessoes s
      JOIN agendamentos a ON s.agendamento_id = a.id
      JOIN pacientes p ON s.paciente_id = p.id  
      JOIN terapeutas t ON s.terapeuta_id = t.id
      WHERE 1=1 ${whereClause}
      ORDER BY a.data_agendamento DESC, a.horario_agendamento ASC
    `;

    const result = await database.query({
      text: query,
      values: values,
    });

    // Calcular resumo
    const sessoes = result.rows;
    const resumo = {
      totalSessoes: sessoes.length,
      valorTotalSessoes: sessoes.reduce(
        (acc, s) => acc + parseFloat(s.valor_sessao || 0),
        0,
      ),
      valorTotalRepasse: sessoes.reduce((acc, s) => {
        // Calcular repasse se não estiver definido
        const repasse =
          s.valor_repasse ||
          calcularRepasse(s.valor_sessao, s.terapeuta_dt_entrada);
        return acc + parseFloat(repasse || 0);
      }, 0),
    };

    return res.status(200).json({
      sessoes: sessoes.map(formatarSessaoFaturamento),
      resumo,
      periodo: periodo || format(new Date(), "yyyy-MM"),
    });
  } catch (error) {
    console.error("Erro ao buscar faturamento:", error);
    return res.status(500).json({
      error: "Erro ao buscar dados de faturamento",
      message: error.message,
    });
  }
}

function calcularRepasse(valorSessao, dataEntrada) {
  try {
    const entrada = new Date(dataEntrada);
    const agora = new Date();
    const mesesTrabalhando =
      (agora.getFullYear() - entrada.getFullYear()) * 12 +
      (agora.getMonth() - entrada.getMonth());

    return mesesTrabalhando < 12 ? valorSessao * 0.45 : valorSessao * 0.5;
  } catch {
    return valorSessao * 0.45;
  }
}

function formatarSessaoFaturamento(row) {
  return {
    id: row.sessao_id,
    data: row.data_agendamento,
    horario: row.horario_agendamento,
    paciente: row.paciente_nome,
    terapeuta: row.terapeuta_nome,
    terapeuta_dt_entrada: row.terapeuta_dt_entrada, // Adicionado campo
    tipo: row.tipo_sessao,
    modalidade: row.modalidade_agendamento,
    valor: parseFloat(row.valor_sessao || 0),
    repasse:
      row.valor_repasse ||
      calcularRepasse(row.valor_sessao, row.terapeuta_dt_entrada),
    status: row.status_sessao,
  };
}

export default router.handler(controller.errorHandlers);
