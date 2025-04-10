import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user.js";
import bcrypt from "bcrypt";
import speakeasy from "speakeasy";
import { serialize } from "cookie";

const router = createRouter();

router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const { email, password, mfaToken } = request.body;

  try {
    const userFound = await user.findOneByEmail(email);

    const isPasswordValid = await bcrypt.compare(password, userFound.password);
    if (!isPasswordValid) {
      return response.status(401).json({
        error: "Invalid email or password. Please try again.",
      });
    }

    if (userFound.is_mfa_enabled) {
      const isMfaTokenValid = speakeasy.totp.verify({
        secret: userFound.mfa_secret,
        encoding: "base32",
        token: mfaToken,
      });

      if (!isMfaTokenValid) {
        return response.status(401).json({
          error: "Invalid MFA token. Please try again.",
        });
      }
    }

    const sessionToken = generateSessionToken(userFound.id);
    const cookie = serialize("sessionToken", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });

    response.setHeader("Set-Cookie", cookie);
    return response.status(200).json({ message: "Login successful" });
  } catch (error) {
    if (error.name === "NotFoundError") {
      return response.status(401).json({
        error: "Invalid email or password. Please try again.",
      });
    }

    return response.status(500).json({
      error: "An unexpected error occurred. Please try again later.",
    });
  }
}

function generateSessionToken(userId) {
  // Implement your session token generation logic here
  return "session-token-placeholder";
}
