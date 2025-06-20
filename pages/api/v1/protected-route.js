import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import authMiddleware from "utils/authMiddleware.js";

const router = createRouter();

// Aplicar middleware de autenticação
router.use(authMiddleware);
// Rota protegida que só pode ser acessada com autenticação
router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  // O request.user é definido pelo middleware de autenticação
  return response.status(200).json({
    message: "Rota protegida acessada com sucesso",
    user: request.user,
  });
}
