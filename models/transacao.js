import database from "infra/database.js";
import { ValidationError, NotFoundError } from "infra/errors.js";

async function create(transacaoData) {
  try {
    // Validar campos obrigatórios
    if (!transacaoData.tipo) {
      throw new ValidationError({
        message: "Tipo da transação é obrigatório",
      });
    }

    if (!["entrada", "saida"].includes(transacaoData.tipo)) {
      throw new ValidationError({
        message: "Tipo deve ser 'entrada' ou 'saida'",
      });
    }

    if (!transacaoData.categoria) {
      throw new ValidationError({
        message: "Categoria é obrigatória",
      });
    }

    if (!transacaoData.descricao) {
      throw new ValidationError({
        message: "Descrição é obrigatória",
      });
    }

    if (!transacaoData.valor || transacaoData.valor <= 0) {
      throw new ValidationError({
        message: "Valor deve ser maior que zero",
      });
    }

    if (!transacaoData.data) {
      throw new ValidationError({
        message: "Data é obrigatória",
      });
    }

    if (!transacaoData.usuario_id) {
      throw new ValidationError({
        message: "ID do usuário é obrigatório",
      });
    }

    // Inserir a transação no banco
    const result = await database.query({
      text: `
        INSERT INTO transacoes (
          tipo,
          categoria,
          descricao,
          valor,
          data,
          usuario_id,
          observacoes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `,
      values: [
        transacaoData.tipo,
        transacaoData.categoria,
        transacaoData.descricao,
        transacaoData.valor,
        transacaoData.data,
        transacaoData.usuario_id,
        transacaoData.observacoes || null,
      ],
    });

    return result.rows[0];
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new Error(`Erro ao criar transação: ${error.message}`);
  }
}

async function findAll(filters = {}) {
  try {
    let query = `
      SELECT 
        t.*,
        u.name as usuario_nome
      FROM transacoes t
      LEFT JOIN users u ON t.usuario_id = u.id
    `;

    const conditions = [];
    const values = [];
    let paramCount = 0;

    // Filtro por período (mês/ano)
    if (filters.periodo) {
      paramCount++;
      conditions.push(
        `DATE_TRUNC('month', t.data) = DATE_TRUNC('month', $${paramCount}::date)`,
      );
      values.push(`${filters.periodo}-01`);
    }

    // Filtro por tipo
    if (filters.tipo) {
      paramCount++;
      conditions.push(`t.tipo = $${paramCount}`);
      values.push(filters.tipo);
    }

    // Filtro por categoria
    if (filters.categoria) {
      paramCount++;
      conditions.push(`t.categoria = $${paramCount}`);
      values.push(filters.categoria);
    }

    // Filtro por data inicial
    if (filters.dataInicial) {
      paramCount++;
      conditions.push(`t.data >= $${paramCount}`);
      values.push(filters.dataInicial);
    }

    // Filtro por data final
    if (filters.dataFinal) {
      paramCount++;
      conditions.push(`t.data <= $${paramCount}`);
      values.push(filters.dataFinal);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += ` ORDER BY t.data DESC, t.created_at DESC`;

    const result = await database.query({
      text: query,
      values: values,
    });

    return result.rows;
  } catch (error) {
    throw new Error(`Erro ao buscar transações: ${error.message}`);
  }
}

async function findById(id) {
  try {
    if (!id) {
      throw new ValidationError({
        message: "ID é obrigatório",
      });
    }

    const result = await database.query({
      text: `
        SELECT 
          t.*,
          u.name as usuario_nome
        FROM transacoes t
        LEFT JOIN users u ON t.usuario_id = u.id
        WHERE t.id = $1
      `,
      values: [id],
    });

    if (result.rows.length === 0) {
      throw new NotFoundError({
        message: "Transação não encontrada",
      });
    }

    return result.rows[0];
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }

    throw new Error(`Erro ao buscar transação: ${error.message}`);
  }
}

async function update(id, updateData) {
  try {
    if (!id) {
      throw new ValidationError({
        message: "ID é obrigatório",
      });
    }

    // Verificar se a transação existe
    await findById(id);

    const updateFields = [];
    const values = [];
    let paramCount = 0;

    // Campos que podem ser atualizados
    const allowedFields = [
      "tipo",
      "categoria",
      "descricao",
      "valor",
      "data",
      "observacoes",
    ];

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        paramCount++;
        updateFields.push(`${field} = $${paramCount}`);
        values.push(updateData[field]);
      }
    }

    if (updateFields.length === 0) {
      throw new ValidationError({
        message: "Nenhum campo válido para atualização",
      });
    }

    // Adicionar updated_at
    paramCount++;
    updateFields.push(`updated_at = $${paramCount}`);
    values.push(new Date());

    // Adicionar ID para o WHERE
    paramCount++;
    values.push(id);

    const result = await database.query({
      text: `
        UPDATE transacoes 
        SET ${updateFields.join(", ")}
        WHERE id = $${paramCount}
        RETURNING *
      `,
      values: values,
    });

    return result.rows[0];
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }

    throw new Error(`Erro ao atualizar transação: ${error.message}`);
  }
}

async function remove(id) {
  try {
    if (!id) {
      throw new ValidationError({
        message: "ID é obrigatório",
      });
    }

    // Verificar se a transação existe
    await findById(id);

    const result = await database.query({
      text: "DELETE FROM transacoes WHERE id = $1 RETURNING *",
      values: [id],
    });

    return result.rows[0];
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }

    throw new Error(`Erro ao excluir transação: ${error.message}`);
  }
}

async function getResumoFinanceiro(periodo) {
  try {
    if (!periodo) {
      throw new ValidationError({
        message: "Período é obrigatório (formato: YYYY-MM)",
      });
    }

    const result = await database.query({
      text: `
        SELECT 
          SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END) as entradas_manuais,
          SUM(CASE WHEN tipo = 'saida' THEN valor ELSE 0 END) as saidas_manuais,
          COUNT(*) as total_transacoes
        FROM transacoes 
        WHERE DATE_TRUNC('month', data) = DATE_TRUNC('month', $1::date)
      `,
      values: [`${periodo}-01`],
    });

    const resumo = result.rows[0];

    return {
      periodo,
      entradasManuais: parseFloat(resumo.entradas_manuais) || 0,
      saidasManuais: parseFloat(resumo.saidas_manuais) || 0,
      totalTransacoes: parseInt(resumo.total_transacoes) || 0,
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new Error(`Erro ao buscar resumo financeiro: ${error.message}`);
  }
}

async function getCategorias() {
  try {
    const result = await database.query({
      text: `
        SELECT DISTINCT categoria
        FROM transacoes
        ORDER BY categoria
      `,
    });

    return result.rows.map((row) => row.categoria);
  } catch (error) {
    throw new Error(`Erro ao buscar categorias: ${error.message}`);
  }
}

const transacao = {
  create,
  findAll,
  findById,
  update,
  remove,
  getResumoFinanceiro,
  getCategorias,
};

export default transacao;
