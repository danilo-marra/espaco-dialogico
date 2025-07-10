import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import authMiddleware from "utils/authMiddleware.js";

const router = createRouter();

router.use(authMiddleware).get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  return response.status(200).json({
    message: "Acesso permitido à rota protegida!",
    user: request.user,
  });
}
