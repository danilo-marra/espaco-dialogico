import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import terapeuta from "models/terapeuta.js";

const router = createRouter();

router.get(getHandler);
router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const terapeutaInputValues = request.body;
  const newTerapeuta = await terapeuta.create(terapeutaInputValues);
  return response.status(201).json(newTerapeuta);
}

async function getHandler(request, response) {
  const terapeutas = await terapeuta.getAll();
  return response.status(200).json(terapeutas);
}
