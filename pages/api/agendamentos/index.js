import { createRouter } from "next-connect";
import controller from "infra/controller.js";

const router = createRouter();

// Redirecionar para a rota correta
router.all((req, res) => {
  // Construir nova URL mantendo query params e método
  const newUrl = `/api/v1/agendamentos${req.url.replace("/agendamentos", "")}`;

  // Redirecionar internamente
  req.url = newUrl;

  // Importar e executar o handler da rota real
  import("../v1/agendamentos/index.js").then(({ default: handler }) => {
    handler(req, res);
  });
});

export default router.handler(controller.errorHandlers);
