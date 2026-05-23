import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import dashboardPendencias from "models/dashboardPendencias.js";
import authMiddleware from "utils/authMiddleware.js";
import { requirePermission } from "utils/roleMiddleware.js";

const router = createRouter();

router.use(authMiddleware).use(requirePermission("sessoes"));
router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const { periodo } = request.query;
  const dados = await dashboardPendencias.obterPendencias(periodo);

  response.setHeader(
    "Cache-Control",
    "private, max-age=120, stale-while-revalidate=30",
  );
  response.setHeader("X-Content-Type-Options", "nosniff");

  return response.status(200).json(dados);
}
