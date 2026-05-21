import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import sessao from "models/sessao.js";
import terapeuta from "models/terapeuta.js";
import authMiddleware from "utils/authMiddleware.js";
import { requirePermission } from "utils/roleMiddleware.js";
import {
  requireTerapeutaAccess,
  terapeutaTemAcessoPaciente,
} from "utils/terapeutaMiddleware.js";

const router = createRouter();

router.get(
  authMiddleware,
  requirePermission("sessoes"),
  requireTerapeutaAccess(),
  getHandler,
);
router.put(authMiddleware, requirePermission("sessoes"), putHandler);
router.delete(authMiddleware, requirePermission("sessoes"), deleteHandler);

// Exportar o handler com tratamento de erros
export default router.handler(controller.errorHandlers);

// Buscar uma sessão específica por ID
async function getHandler(request, response) {
  const id = request.query.id;
  const sessaoFound = await sessao.getById(id);

  const hasAccess = await therapistHasSessionAccess(request, sessaoFound);

  if (!hasAccess) {
    return response.status(403).json({ error: "Acesso negado" });
  }

  return response.status(200).json(sessaoFound);
}

// Atualizar uma sessão
async function putHandler(request, response) {
  try {
    const id = request.query.id;
    const sessaoFound = await sessao.getById(id);
    const {
      tipoSessao,
      valorSessao,
      valorRepasse,
      repasseRealizado,
      pagamentoRealizado,
      notaFiscal,
    } = request.body;

    const hasAccess = await therapistHasSessionAccess(request, sessaoFound);

    if (!hasAccess) {
      return response.status(403).json({ error: "Acesso negado" });
    }

    if (tipoSessao) {
      const tiposSessaoValidos = [
        "Anamnese",
        "Atendimento",
        "Avaliação",
        "Visitar Escolar",
      ];

      if (!tiposSessaoValidos.includes(tipoSessao)) {
        return response.status(400).json({ error: "Tipo de sessão inválido" });
      }
    }

    if (notaFiscal) {
      const notasFiscaisValidas = ["Não Emitida", "Emitida", "Enviada"];

      if (!notasFiscaisValidas.includes(notaFiscal)) {
        return response.status(400).json({
          error: "Status de nota fiscal inválido",
        });
      }
    }

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
    if (error?.name === "ServiceError") {
      return response.status(500).json({
        error: "Erro interno ao atualizar sessão",
      });
    }

    throw error;
  }
}

// Excluir uma sessão
async function deleteHandler(request, response) {
  const id = request.query.id;
  const sessaoFound = await sessao.getById(id);

  const hasAccess = await therapistHasSessionAccess(request, sessaoFound);

  if (!hasAccess) {
    return response.status(403).json({ error: "Acesso negado" });
  }

  await sessao.remove(id);

  return response.status(204).send();
}

async function therapistHasSessionAccess(request, sessaoFound) {
  if (request.user?.role !== "terapeuta") {
    return true;
  }

  const terapeutaFound =
    request.terapeutaId || (await terapeuta.getByUserId(request.user.id));
  const terapeutaId =
    typeof terapeutaFound === "string" ? terapeutaFound : terapeutaFound?.id;

  const acessoPorSessao =
    terapeutaId && sessaoFound.terapeuta_id === terapeutaId;
  const acessoPorPaciente = terapeutaId
    ? await terapeutaTemAcessoPaciente(terapeutaId, sessaoFound.paciente_id)
    : false;

  return acessoPorSessao || acessoPorPaciente;
}
