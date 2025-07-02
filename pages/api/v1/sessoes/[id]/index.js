import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import sessao from "models/sessao.js";
import authMiddleware from "utils/authMiddleware.js";

const router = createRouter();

// Aplicar middleware de autenticação
router.use(authMiddleware);

router.get(getHandler);
router.put(putHandler);
router.delete(deleteHandler);

// Exportar o handler com tratamento de erros
export default router.handler(controller.errorHandlers);

// Buscar uma sessão específica por ID
async function getHandler(request, response) {
  try {
    const id = request.query.id;
    const sessaoFound = await sessao.getById(id);
    return response.status(200).json(sessaoFound);
  } catch (error) {
    if (error.name === "NotFoundError") {
      return response.status(404).json({ error: error.message });
    }
    return response.status(500).json({ error: "Erro ao buscar sessão" });
  }
}

// Atualizar uma sessão
async function putHandler(request, response) {
  try {
    const id = request.query.id;
    const {
      tipoSessao,
      valorSessao,
      valorRepasse,
      repasseRealizado,
      pagamentoRealizado,
      notaFiscal,
    } = request.body;

    // Validar tipo de sessão se fornecido
    if (tipoSessao) {
      const tiposSessaoValidos = [
        "Anamnese",
        "Atendimento",
        "Avaliação",
        "Visitar Escolar",
      ];
      if (!tiposSessaoValidos.includes(tipoSessao)) {
        return response.status(400).json({
          error: "Tipo de sessão inválido",
        });
      }
    }

    // Validar valor da sessão se fornecido
    if (notaFiscal) {
      const notasFiscaisValidas = ["Não Emitida", "Emitida", "Enviada"];
      if (!notasFiscaisValidas.includes(notaFiscal)) {
        return response.status(400).json({
          error: "Status de nota fiscal inválido",
        });
      }
    }

    // Usar o método update do modelo
    const updatedSessao = await sessao.update(id, {
      tipoSessao,
      valorSessao,
      valorRepasse,
      repasseRealizado,
      pagamentoRealizado,
      notaFiscal,
    });

    return response.status(200).json(updatedSessao);
  } catch (error) {
    console.error("Erro ao atualizar sessão:", error);

    if (error.name === "NotFoundError") {
      return response.status(404).json({ error: error.message });
    }

    if (error.name === "ValidationError") {
      return response.status(400).json({ error: error.message });
    }

    return response.status(500).json({ error: "Erro ao atualizar sessão" });
  }
}

// Excluir uma sessão
async function deleteHandler(request, response) {
  try {
    const id = request.query.id;

    // Usar o método remove do modelo
    await sessao.remove(id);

    return response.status(204).send();
  } catch (error) {
    console.error("Erro ao excluir sessão:", error);

    if (error.name === "NotFoundError") {
      return response.status(404).json({ error: error.message });
    }

    return response.status(500).json({ error: "Erro ao excluir sessão" });
  }
}
