import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import authMiddleware from "utils/authMiddleware.js";

const router = createRouter();

router.use(authMiddleware);

router.get((request, response) => {
  if (!request.user) {
    return response.status(401).json({
      error: "Usuário não autenticado.",
    });
  }

  return response.status(200).json(request.user);
});

export default router.handler(controller.errorHandlers);
