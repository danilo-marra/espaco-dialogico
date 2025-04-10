import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user.js";
import bcrypt from "bcrypt";
import speakeasy from "speakeasy";

const router = createRouter();

router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const userInputValues = request.body;
  const hashedPassword = await bcrypt.hash(userInputValues.password, 10);
  userInputValues.password = hashedPassword;
  const newUser = await user.create(userInputValues);
  return response.status(201).json(newUser);
}
