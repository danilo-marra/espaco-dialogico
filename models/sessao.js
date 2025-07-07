import database from "infra/database.js";
import { ValidationError, NotFoundError } from "infra/errors.js";

async function create(sessaoData) {
  try {
    // Validar campos obrigatórios
    if (!sessaoData.terapeuta_id) {
      throw new ValidationError({
        message: "ID do terapeuta é obrigatório",
      });
    }

    if (!sessaoData.paciente_id) {
      throw new ValidationError({
        message: "ID do paciente é obrigatório",
      });
    }

    if (!sessaoData.tipoSessao) {
      throw new ValidationError({
        message: "Tipo de sessão é obrigatório",
      });
    }

    if (!sessaoData.valorSessao && sessaoData.valorSessao !== 0) {
      throw new ValidationError({
        message: "Valor da sessão é obrigatório",
      });
    }

    // Inserir a sessão no banco
    const result = await database.query({
      text: `
        INSERT INTO sessoes (
          terapeuta_id,
          paciente_id,
          agendamento_id,
          tipo_sessao,
          valor_sessao,
          valor_repasse,
          repasse_realizado,
          pagamento_realizado,
          nota_fiscal
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `,
      values: [
        sessaoData.terapeuta_id,
        sessaoData.paciente_id,
        sessaoData.agendamento_id || null,
        sessaoData.tipoSessao, // Corrigido: usando tipoSessao em vez de tipo_sessao
        sessaoData.valorSessao, // Corrigido: usando valorSessao em vez de valor_sessao
        sessaoData.valor_repasse || null,
        sessaoData.repasse_realizado || false,
        sessaoData.pagamento_realizado || false,
        sessaoData.nota_fiscal || "Não Emitida",
      ],
    });

    // Retornar sessão com informações completas
    return await getById(result.rows[0].id);
  } catch (error) {
    console.error("Erro ao criar sessão:", error);
    throw error;
  }
}

async function getAll() {
  try {
    const result = await database.query({
      text: `
      SELECT 
        s.*,
        t.nome as terapeuta_nome,
        t.foto as terapeuta_foto,
        t.telefone as terapeuta_telefone,
        t.email as terapeuta_email,
        t.crp as terapeuta_crp,
      t.dt_nascimento as terapeuta_dt_nascimento,
        t.dt_entrada as terapeuta_dt_entrada,
        t.chave_pix as terapeuta_chave_pix,
        p.nome as paciente_nome,
        p.dt_nascimento as paciente_dt_nascimento,
        p.nome_responsavel as paciente_nome_responsavel,
        p.telefone_responsavel as paciente_telefone_responsavel,
        p.email_responsavel as paciente_email_responsavel,
        p.cpf_responsavel as paciente_cpf_responsavel,
        p.endereco_responsavel as paciente_endereco_responsavel,
        p.origem as paciente_origem,
        p.dt_entrada as paciente_dt_entrada,
        a.data_agendamento as agendamento_data,
        a.horario_agendamento as agendamento_horario,
        a.local_agendamento as agendamento_local,
        a.modalidade_agendamento as agendamento_modalidade,
        a.status_agendamento as agendamento_status,
        a.observacoes_agendamento as agendamento_observacoes,
        a.falta as agendamento_falta
      FROM sessoes s
      LEFT JOIN terapeutas t ON s.terapeuta_id = t.id
      LEFT JOIN pacientes p ON s.paciente_id = p.id
      LEFT JOIN agendamentos a ON s.agendamento_id = a.id
      ORDER BY s.created_at DESC
    `,
    });
    return result.rows.map(formatSessaoResult);
  } catch (error) {
    console.error("Erro ao buscar sessões:", error);
    throw error;
  }
}

async function getFiltered(filters) {
  try {
    const conditions = [];
    const values = [];
    let paramCounter = 1;

    if (filters.terapeuta_id) {
      conditions.push(`s.terapeuta_id = $${paramCounter}`);
      values.push(filters.terapeuta_id);
      paramCounter++;
    }

    if (filters.paciente_id) {
      conditions.push(`s.paciente_id = $${paramCounter}`);
      values.push(filters.paciente_id);
      paramCounter++;
    }

    if (filters.tipo_sessao) {
      conditions.push(`s.tipo_sessao = $${paramCounter}`);
      values.push(filters.tipo_sessao);
      paramCounter++;
    }

    if (filters.pagamento_realizado !== undefined) {
      conditions.push(`s.pagamento_realizado = $${paramCounter}`);
      values.push(filters.pagamento_realizado);
      paramCounter++;
    }

    if (filters.nota_fiscal) {
      conditions.push(`s.nota_fiscal = $${paramCounter}`);
      values.push(filters.nota_fiscal);
      paramCounter++;
    }

    if (filters.repasse_realizado !== undefined) {
      conditions.push(`s.repasse_realizado = $${paramCounter}`);
      values.push(filters.repasse_realizado);
      paramCounter++;
    }

    if (filters.dataInicio && filters.dataFim) {
      conditions.push(
        `s.data_sessao BETWEEN $${paramCounter} AND $${paramCounter + 1}`,
      );
      values.push(filters.dataInicio, filters.dataFim);
      paramCounter += 2;
    }

    if (filters.agendamento_id) {
      conditions.push(`s.agendamento_id = $${paramCounter}`);
      values.push(filters.agendamento_id);
      paramCounter++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await database.query({
      text: `
    SELECT 
      s.*,
      t.nome as terapeuta_nome,
      t.foto as terapeuta_foto,
      t.telefone as terapeuta_telefone,
      t.email as terapeuta_email,
      t.crp as terapeuta_crp,
      t.dt_nascimento as terapeuta_dt_nascimento,
      t.dt_entrada as terapeuta_dt_entrada,
      t.chave_pix as terapeuta_chave_pix,
      p.nome as paciente_nome,
      p.dt_nascimento as paciente_dt_nascimento,
      p.nome_responsavel as paciente_nome_responsavel,
      p.telefone_responsavel as paciente_telefone_responsavel,
      p.email_responsavel as paciente_email_responsavel,
      p.cpf_responsavel as paciente_cpf_responsavel,
      p.endereco_responsavel as paciente_endereco_responsavel,
      p.origem as paciente_origem,
      p.dt_entrada as paciente_dt_entrada,
      a.data_agendamento as agendamento_data,
      a.horario_agendamento as agendamento_horario,
      a.local_agendamento as agendamento_local,
      a.modalidade_agendamento as agendamento_modalidade,
      a.status_agendamento as agendamento_status,
      a.observacoes_agendamento as agendamento_observacoes,
      a.falta as agendamento_falta
    FROM sessoes s
    LEFT JOIN terapeutas t ON s.terapeuta_id = t.id
    LEFT JOIN pacientes p ON s.paciente_id = p.id
    LEFT JOIN agendamentos a ON s.agendamento_id = a.id
    ${whereClause}
    ORDER BY 
      COALESCE(a.data_agendamento, s.created_at) DESC
    ${filters.limit ? `LIMIT $${paramCounter}` : ""}
    ${filters.offset ? `OFFSET $${filters.limit ? paramCounter + 1 : paramCounter}` : ""}
  `,
      values:
        filters.limit || filters.offset
          ? [
              ...values,
              ...(filters.limit ? [filters.limit] : []),
              ...(filters.offset ? [filters.offset] : []),
            ]
          : values,
    });

    return result.rows.map(formatSessaoResult);
  } catch (error) {
    console.error("Erro ao buscar sessões filtradas:", error);
    throw error;
  }
}

async function getById(id) {
  try {
    const result = await database.query({
      text: `
      SELECT 
        s.*,
        t.nome as terapeuta_nome,
        t.foto as terapeuta_foto,
        t.telefone as terapeuta_telefone,
        t.email as terapeuta_email,
        t.crp as terapeuta_crp,
      t.dt_nascimento as terapeuta_dt_nascimento,
        t.dt_entrada as terapeuta_dt_entrada,
        t.chave_pix as terapeuta_chave_pix,
        p.nome as paciente_nome,
        p.dt_nascimento as paciente_dt_nascimento,
        p.nome_responsavel as paciente_nome_responsavel,
        p.telefone_responsavel as paciente_telefone_responsavel,
        p.email_responsavel as paciente_email_responsavel,
        p.cpf_responsavel as paciente_cpf_responsavel,
        p.endereco_responsavel as paciente_endereco_responsavel,
        p.origem as paciente_origem,
        p.dt_entrada as paciente_dt_entrada,
        a.data_agendamento as agendamento_data,
        a.horario_agendamento as agendamento_horario,
        a.local_agendamento as agendamento_local,
        a.modalidade_agendamento as agendamento_modalidade,
        a.status_agendamento as agendamento_status,
        a.observacoes_agendamento as agendamento_observacoes,
        a.falta as agendamento_falta
      FROM sessoes s
      LEFT JOIN terapeutas t ON s.terapeuta_id = t.id
      LEFT JOIN pacientes p ON s.paciente_id = p.id
      LEFT JOIN agendamentos a ON s.agendamento_id = a.id
      WHERE s.id = $1
    `,
      values: [id],
    });

    if (result.rowCount === 0) {
      throw new NotFoundError({
        message: "Sessão não encontrada",
      });
    }

    return formatSessaoResult(result.rows[0]);
  } catch (error) {
    console.error("Erro ao buscar sessão por ID:", error);
    throw error;
  }
}

async function update(id, sessaoData) {
  // Verificar se a sessão existe
  await getById(id);

  // Preparar os campos a serem atualizados
  const fieldsToUpdate = [];
  const values = [];
  let paramCounter = 1;

  // Função auxiliar para adicionar campos a serem atualizados
  function addField(fieldName, value) {
    if (value !== undefined) {
      fieldsToUpdate.push(`${fieldName} = $${paramCounter}`);
      values.push(value);
      paramCounter++;
    }
  }

  // Adicionar cada campo que precisa ser atualizado
  addField("terapeuta_id", sessaoData.terapeuta_id);
  addField("paciente_id", sessaoData.paciente_id);
  addField("agendamento_id", sessaoData.agendamento_id);
  addField("tipo_sessao", sessaoData.tipoSessao);
  addField("valor_sessao", sessaoData.valorSessao);
  addField("valor_repasse", sessaoData.valorRepasse);
  addField("repasse_realizado", sessaoData.repasseRealizado);
  addField("pagamento_realizado", sessaoData.pagamentoRealizado);
  addField("nota_fiscal", sessaoData.notaFiscal);

  // Se não houver campos para atualizar, retornar a sessão existente
  if (fieldsToUpdate.length === 0) {
    return await getById(id);
  }

  // Adicionar o id como último parâmetro
  values.push(id);

  // Executar o update
  try {
    await database.query({
      text: `
      UPDATE sessoes
      SET ${fieldsToUpdate.join(", ")}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCounter}
    `,
      values: values,
    });

    // Retornar a sessão atualizada
    return await getById(id);
  } catch (error) {
    console.error("Erro ao atualizar sessão:", error);
    throw new ValidationError({
      message: `Erro ao atualizar sessão: ${error.message}`,
    });
  }
}

async function remove(id) {
  // Verificar se a sessão existe
  await getById(id);

  // Excluir a sessão
  await database.query({
    text: "DELETE FROM sessoes WHERE id = $1",
    values: [id],
  });

  return true;
}

// Função otimizada para remover múltiplas sessões em lote por agendamento_id
async function removeBatchByAgendamentosIds(agendamentoIds) {
  try {
    if (!Array.isArray(agendamentoIds) || agendamentoIds.length === 0) {
      console.log("✅ BATCH: Nenhuma sessão para excluir");
      return 0;
    }

    console.log(
      `🗑️ BATCH: Excluindo sessões de ${agendamentoIds.length} agendamentos...`,
    );

    await database.query({ text: "BEGIN" });

    // Construir placeholders para IN clause
    const placeholders = agendamentoIds
      .map((_, index) => `$${index + 1}`)
      .join(", ");

    // Excluir todas as sessões em uma única query
    const result = await database.query({
      text: `DELETE FROM sessoes WHERE agendamento_id IN (${placeholders})`,
      values: agendamentoIds,
    });

    await database.query({ text: "COMMIT" });

    const sessoesExcluidas = result.rowCount || 0;
    console.log(`✅ BATCH: ${sessoesExcluidas} sessões excluídas com sucesso`);

    return sessoesExcluidas;
  } catch (error) {
    await database.query({ text: "ROLLBACK" });
    console.error("❌ BATCH: Erro ao excluir sessões em lote:", error);
    throw new ValidationError({
      message: `Erro ao excluir sessões em lote: ${error.message}`,
    });
  }
}

// Função alternativa para remover sessões por lista de IDs diretos
async function removeBatchByIds(sessaoIds) {
  try {
    if (!Array.isArray(sessaoIds) || sessaoIds.length === 0) {
      console.log("✅ BATCH: Nenhuma sessão para excluir");
      return 0;
    }

    console.log(`🗑️ BATCH: Excluindo ${sessaoIds.length} sessões por ID...`);

    await database.query({ text: "BEGIN" });

    // Dividir em chunks para evitar limitações de SQL
    const BATCH_SIZE = 100;
    let totalExcluidas = 0;

    for (let i = 0; i < sessaoIds.length; i += BATCH_SIZE) {
      const chunk = sessaoIds.slice(i, i + BATCH_SIZE);
      const placeholders = chunk.map((_, index) => `$${index + 1}`).join(", ");

      const result = await database.query({
        text: `DELETE FROM sessoes WHERE id IN (${placeholders})`,
        values: chunk,
      });

      totalExcluidas += result.rowCount || 0;
    }

    await database.query({ text: "COMMIT" });

    console.log(`✅ BATCH: ${totalExcluidas} sessões excluídas com sucesso`);
    return totalExcluidas;
  } catch (error) {
    await database.query({ text: "ROLLBACK" });
    console.error("❌ BATCH: Erro ao excluir sessões em lote:", error);
    throw new ValidationError({
      message: `Erro ao excluir sessões em lote: ${error.message}`,
    });
  }
}

async function updateRepasseStatusBatch(sessoesIds, repasseRealizado) {
  if (!Array.isArray(sessoesIds) || sessoesIds.length === 0) {
    return 0;
  }

  try {
    const placeholders = sessoesIds
      .map((_, index) => `$${index + 2}`)
      .join(", ");
    const result = await database.query({
      text: `
        UPDATE sessoes
        SET repasse_realizado = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id IN (${placeholders})
      `,
      values: [repasseRealizado, ...sessoesIds],
    });

    return result.rowCount;
  } catch (error) {
    console.error("Erro ao atualizar status do repasse em lote:", error);
    throw new ValidationError({
      message: `Erro ao atualizar status do repasse em lote: ${error.message}`,
    });
  }
}

async function updatePagamentoStatusBatch(sessoesIds, pagamentoRealizado) {
  if (!Array.isArray(sessoesIds) || sessoesIds.length === 0) {
    return 0;
  }

  try {
    const placeholders = sessoesIds
      .map((_, index) => `$${index + 2}`)
      .join(", ");
    const result = await database.query({
      text: `
        UPDATE sessoes
        SET pagamento_realizado = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id IN (${placeholders})
      `,
      values: [pagamentoRealizado, ...sessoesIds],
    });

    return result.rowCount;
  } catch (error) {
    console.error("Erro ao atualizar status do pagamento em lote:", error);
    throw new ValidationError({
      message: `Erro ao atualizar status do pagamento em lote: ${error.message}`,
    });
  }
}

function formatSessaoResult(row) {
  return {
    id: row.id,
    terapeuta_id: row.terapeuta_id,
    paciente_id: row.paciente_id,
    agendamento_id: row.agendamento_id,
    tipoSessao: row.tipo_sessao,
    valorSessao: parseFloat(row.valor_sessao),
    valorRepasse: row.valor_repasse ? parseFloat(row.valor_repasse) : null,
    repasseRealizado: row.repasse_realizado || false,
    pagamentoRealizado: row.pagamento_realizado || false,
    notaFiscal: row.nota_fiscal || "Não Emitida",
    created_at: row.created_at,
    updated_at: row.updated_at,

    // Informações do terapeuta
    terapeutaInfo: {
      id: row.terapeuta_id,
      nome: row.terapeuta_nome,
      foto: row.terapeuta_foto,
      telefone: row.terapeuta_telefone,
      email: row.terapeuta_email,
      crp: row.terapeuta_crp,
      dt_nascimento: row.terapeuta_dt_nascimento,
      dt_entrada: row.terapeuta_dt_entrada,
      chave_pix: row.terapeuta_chave_pix,
    },

    // Informações do paciente
    pacienteInfo: {
      id: row.paciente_id,
      nome: row.paciente_nome,
      dt_nascimento: row.paciente_dt_nascimento,
      nome_responsavel: row.paciente_nome_responsavel,
      telefone_responsavel: row.paciente_telefone_responsavel,
      email_responsavel: row.paciente_email_responsavel,
      cpf_responsavel: row.paciente_cpf_responsavel,
      endereco_responsavel: row.paciente_endereco_responsavel,
      origem: row.paciente_origem,
      dt_entrada: row.paciente_dt_entrada,
    },

    // Informações do agendamento
    agendamentoInfo: {
      id: row.agendamento_id,
      dataAgendamento: row.agendamento_data,
      horarioAgendamento: row.agendamento_horario,
      localAgendamento: row.agendamento_local,
      modalidadeAgendamento: row.agendamento_modalidade,
      tipoAgendamento: row.tipo_agendamento,
      valorAgendamento: row.valor_agendamento
        ? parseFloat(row.valor_agendamento)
        : undefined,
      statusAgendamento: row.agendamento_status,
      falta: row.agendamento_falta || false,
    },
  };
}

async function createBatch(sessoesData) {
  if (!sessoesData || sessoesData.length === 0) {
    console.warn("Nenhuma sessão para criar");
    return 0;
  }

  try {
    await database.query({ text: "BEGIN" });

    let totalSessoesCreated = 0;

    // Para lotes grandes, dividir em chunks menores para evitar timeout
    const BATCH_SIZE = 10; // Reduzido para evitar timeout

    for (let i = 0; i < sessoesData.length; i += BATCH_SIZE) {
      const chunk = sessoesData.slice(i, i + BATCH_SIZE);

      // Preparar dados para inserção do chunk atual
      const allValues = [];
      const placeholders = [];

      chunk.forEach((sessaoData, index) => {
        // Validar dados essenciais
        if (!sessaoData.terapeuta_id || !sessaoData.paciente_id) {
          throw new ValidationError({
            message: `Dados incompletos na sessão ${i + index + 1}`,
          });
        }

        const base = index * 9;
        placeholders.push(
          `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9})`,
        );

        allValues.push(
          sessaoData.terapeuta_id,
          sessaoData.paciente_id,
          sessaoData.agendamento_id || null,
          sessaoData.tipoSessao || "Atendimento",
          sessaoData.valorSessao || 0,
          sessaoData.valorRepasse || null,
          sessaoData.repasse_realizado || false,
          sessaoData.pagamento_realizado || false,
          sessaoData.notaFiscal || "Não Emitida",
        );
      });

      // Log apenas para o primeiro chunk ou chunks grandes
      if (i === 0 || sessoesData.length > BATCH_SIZE) {
        console.log(
          `🚀 BATCH: Inserindo ${chunk.length} sessões (${i + 1}-${i + chunk.length}/${sessoesData.length})...`,
        );
      }

      // Inserção do chunk atual
      const result = await database.query({
        text: `
          INSERT INTO sessoes (
          terapeuta_id, 
          paciente_id, 
          agendamento_id,
          tipo_sessao, 
          valor_sessao, 
          valor_repasse,
          repasse_realizado,
          pagamento_realizado,
          nota_fiscal
          )
          VALUES ${placeholders.join(", ")}
          RETURNING id
        `,
        values: allValues,
      });

      totalSessoesCreated += result.rowCount;
    }

    await database.query({ text: "COMMIT" });

    console.log(`✅ BATCH: ${totalSessoesCreated} sessões criadas com sucesso`);

    return totalSessoesCreated;
  } catch (error) {
    await database.query({ text: "ROLLBACK" });
    console.error("Erro ao criar sessões em lote:", error);
    throw new ValidationError({
      message: `Erro ao criar sessões em lote: ${error.message}`,
    });
  }
}

async function updateBatch(sessoesData) {
  if (!sessoesData || sessoesData.length === 0) {
    console.warn("Nenhuma sessão para atualizar");
    return 0;
  }

  try {
    await database.query({ text: "BEGIN" });

    let totalSessoesUpdated = 0;

    // Para lotes grandes, dividir em chunks menores para evitar timeout
    const BATCH_SIZE = 10; // Mantém consistência com createBatch

    for (let i = 0; i < sessoesData.length; i += BATCH_SIZE) {
      const chunk = sessoesData.slice(i, i + BATCH_SIZE);

      // Log apenas para o primeiro chunk ou chunks grandes
      if (i === 0 || sessoesData.length > BATCH_SIZE) {
        console.log(
          `🚀 BATCH: Atualizando ${chunk.length} sessões (${i + 1}-${i + chunk.length}/${sessoesData.length})...`,
        );
      }

      // Atualizar cada sessão do chunk usando UPDATE com WHERE
      for (const sessaoData of chunk) {
        if (!sessaoData.id) {
          console.warn("ID da sessão não fornecido, pulando...");
          continue;
        }

        // Construir campos de atualização dinamicamente
        const updateFields = [];
        const values = [];
        let valueIndex = 1;

        if (sessaoData.tipoSessao !== undefined) {
          updateFields.push(`tipo_sessao = $${valueIndex++}`);
          values.push(sessaoData.tipoSessao);
        }

        if (sessaoData.valorSessao !== undefined) {
          updateFields.push(`valor_sessao = $${valueIndex++}`);
          values.push(sessaoData.valorSessao);
        }

        if (sessaoData.valorRepasse !== undefined) {
          updateFields.push(`valor_repasse = $${valueIndex++}`);
          values.push(sessaoData.valorRepasse);
        }

        if (sessaoData.repasseRealizado !== undefined) {
          updateFields.push(`repasse_realizado = $${valueIndex++}`);
          values.push(sessaoData.repasseRealizado);
        }

        if (sessaoData.pagamentoRealizado !== undefined) {
          updateFields.push(`pagamento_realizado = $${valueIndex++}`);
          values.push(sessaoData.pagamentoRealizado);
        }

        if (sessaoData.notaFiscal !== undefined) {
          updateFields.push(`nota_fiscal = $${valueIndex++}`);
          values.push(sessaoData.notaFiscal);
        }

        // Se não há campos para atualizar, pular esta sessão
        if (updateFields.length === 0) {
          continue;
        }

        // Adicionar o ID no final para o WHERE
        values.push(sessaoData.id);

        const result = await database.query({
          text: `
            UPDATE sessoes 
            SET ${updateFields.join(", ")}, updated_at = NOW()
            WHERE id = $${valueIndex}
            RETURNING id
          `,
          values: values,
        });

        if (result.rowCount > 0) {
          totalSessoesUpdated++;
        }
      }
    }

    await database.query({ text: "COMMIT" });

    console.log(
      `✅ BATCH: ${totalSessoesUpdated} sessões atualizadas com sucesso`,
    );

    return totalSessoesUpdated;
  } catch (error) {
    await database.query({ text: "ROLLBACK" });
    console.error("Erro ao atualizar sessões em lote:", error);
    throw new ValidationError({
      message: `Erro ao atualizar sessões em lote: ${error.message}`,
    });
  }
}

const sessao = {
  create,
  createBatch,
  getAll,
  getById,
  getFiltered,
  update,
  updateBatch,
  remove,
  removeBatchByAgendamentosIds,
  removeBatchByIds,
  updateRepasseStatusBatch,
  updatePagamentoStatusBatch,
};

export default sessao;
