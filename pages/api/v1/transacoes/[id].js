import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import transacao from "models/transacao.js";
import authMiddleware from "utils/authMiddleware.js";

// Criar o router
const router = createRouter();

// Aplicar middleware de autenticação para proteger as rotas
router.use(authMiddleware);

// Middleware para verificar se o usuário é admin
function adminMiddleware(request, response, next) {
  if (request.user.role !== "admin") {
    return response.status(403).json({
      error:
        "Acesso negado. Apenas administradores podem gerenciar transações.",
    });
  }
  next();
}

// Aplicar middleware de admin
router.use(adminMiddleware);

// Definir os handlers para cada método HTTP
router.get(getHandler);
router.put(putHandler);
router.delete(deleteHandler);

// Exportar o handler com tratamento de erros
export default router.handler(controller.errorHandlers);

// Handler para buscar uma transação específica
async function getHandler(request, response) {
  try {
    const { id } = request.query;

    if (!id) {
      return response.status(400).json({
        error: "ID da transação é obrigatório",
      });
    }

    const transacaoEncontrada = await transacao.findById(id);

    return response.status(200).json(transacaoEncontrada);
  } catch (error) {
    console.error("Erro ao buscar transação:", error);

    if (error.message.includes("não encontrada")) {
      return response.status(404).json({ error: error.message });
    }

    return response.status(500).json({
      error: "Erro interno do servidor ao buscar transação",
    });
  }
}

// Handler para atualizar uma transação
async function putHandler(request, response) {
  try {
    const { id } = request.query;
    const { tipo, categoria, descricao, valor, data, observacoes } =
      request.body;

    if (!id) {
      return response.status(400).json({
        error: "ID da transação é obrigatório",
      });
    }

    const updateData = {};

    // Validar e adicionar campos que podem ser atualizados
    if (tipo !== undefined) {
      if (!["entrada", "saida"].includes(tipo)) {
        return response.status(400).json({
          error: "Tipo deve ser 'entrada' ou 'saida'",
        });
      }
      updateData.tipo = tipo;
    }

    if (categoria !== undefined) {
      if (!categoria.trim()) {
        return response.status(400).json({
          error: "Categoria não pode estar vazia",
        });
      }
      updateData.categoria = categoria.trim();
    }

    if (descricao !== undefined) {
      if (!descricao.trim()) {
        return response.status(400).json({
          error: "Descrição não pode estar vazia",
        });
      }
      updateData.descricao = descricao.trim();
    }

    if (valor !== undefined) {
      const valorNumerico = parseFloat(valor);
      if (isNaN(valorNumerico) || valorNumerico <= 0) {
        return response.status(400).json({
          error: "Valor deve ser um número maior que zero",
        });
      }
      updateData.valor = valorNumerico;
    }

    if (data !== undefined) {
      updateData.data = data;
    }

    if (observacoes !== undefined) {
      updateData.observacoes = observacoes;
    }

    if (Object.keys(updateData).length === 0) {
      return response.status(400).json({
        error: "Nenhum campo válido fornecido para atualização",
      });
    }

    const transacaoAtualizada = await transacao.update(id, updateData);

    return response.status(200).json({
      message: "Transação atualizada com sucesso",
      transacao: transacaoAtualizada,
    });
  } catch (error) {
    console.error("Erro ao atualizar transação:", error);

    if (error.message.includes("não encontrada")) {
      return response.status(404).json({ error: error.message });
    }

    if (error.message.includes("Erro ao atualizar transação")) {
      return response.status(400).json({ error: error.message });
    }

    return response.status(500).json({
      error: "Erro interno do servidor ao atualizar transação",
    });
  }
}

// Handler para deletar uma transação
async function deleteHandler(request, response) {
  try {
    const { id } = request.query;

    if (!id) {
      return response.status(400).json({
        error: "ID da transação é obrigatório",
      });
    }

    const transacaoRemovida = await transacao.remove(id);

    return response.status(200).json({
      message: "Transação excluída com sucesso",
      transacao: transacaoRemovida,
    });
  } catch (error) {
    console.error("Erro ao excluir transação:", error);

    if (error.message.includes("não encontrada")) {
      return response.status(404).json({ error: error.message });
    }

    return response.status(500).json({
      error: "Erro interno do servidor ao excluir transação",
    });
  }
}
