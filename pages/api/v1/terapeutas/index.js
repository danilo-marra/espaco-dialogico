import { createRouter } from "next-connect";
import database from "infra/database.js";
import controller from "infra/controller";

const router = createRouter();

router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(req, res) {
  const terapeutas = await database.query("SELECT * FROM terapeutas;");
  res.status(200).json(terapeutas.rows);
}
