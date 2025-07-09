import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user.js";
import invite from "models/invite.js";
import terapeuta from "models/terapeuta.js";
import inviteMock from "tests/mocks/inviteMock.js";

// Use mock em ambiente de teste ou o modelo real em produção
const inviteModel = process.env.NODE_ENV === "test" ? inviteMock : invite;

const router = createRouter();

router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const { username, email, password, inviteCode, role } = request.body;

  // Validação básica dos campos obrigatórios
  const requiredFields = ["username", "email", "password", "inviteCode"];

  for (const field of requiredFields) {
    if (!request.body[field]) {
      return response.status(400).json({
        error: `O campo "${field}" é obrigatório`,
      });
    }
  }

  try {
    // Validar o código de convite
    let inviteResult;
    try {
      inviteResult = await inviteModel.getByCode(inviteCode);

      // Verificar se o convite já foi usado
      if (inviteResult.used) {
        return response.status(400).json({
          error: "Este código de convite já foi utilizado",
          action: "Por favor, solicite um novo código ao administrador.",
        });
      }

      // Verificar se o convite expirou
      if (new Date(inviteResult.expires_at) < new Date()) {
        return response.status(400).json({
          error: "Este código de convite expirou",
          action: "Por favor, solicite um novo código ao administrador.",
        });
      }

      // Verificar se o convite foi emitido para um email específico
      if (
        inviteResult.email &&
        inviteResult.email.toLowerCase() !== email.toLowerCase()
      ) {
        return response.status(400).json({
          error:
            "Este código de convite só pode ser usado com o email específico para o qual foi emitido",
          action:
            "Use o email para o qual o convite foi enviado ou solicite um novo convite.",
        });
      }
    } catch (error) {
      return response.status(400).json({
        error: "Código de convite inválido",
        action: "Por favor, verifique o código ou solicite um novo.",
      });
    }

    // Criar o usuário com a função definida no convite ou a função especificada
    const userRole = role || inviteResult.role || "secretaria";
    const userInputValues = {
      username,
      email,
      password,
      role: userRole,
    };

    const newUser = await user.create(userInputValues);

    // Marcar o convite como usado
    await inviteModel.validateAndUse(inviteCode, newUser.id);

    // Se o usuário é um terapeuta, tentar vinculá-lo ao registro de terapeuta existente
    if (userRole.toLowerCase() === "terapeuta") {
      try {
        const existingTerapeuta = await terapeuta.getByEmail(
          email.toLowerCase(),
        );

        if (existingTerapeuta && !existingTerapeuta.user_id) {
          await terapeuta.linkUser(existingTerapeuta.id, newUser.id);
        } else if (existingTerapeuta && existingTerapeuta.user_id) {
          console.warn(
            `[VINCULAÇÃO] ⚠️ Terapeuta com email ${email} já tem usuário associado.`,
          );
        } else {
          // NOVO: Criar registro de terapeuta automaticamente se não existir
          try {
            await terapeuta.createFromUser({
              user_id: newUser.id,
              nome: username,
              email: email.toLowerCase(),
            });
          } catch (terapeutaError) {
            console.error(
              `[VINCULAÇÃO] ❌ Erro ao criar terapeuta, fazendo rollback do usuário:`,
              terapeutaError.message,
            );

            // Rollback: remover o usuário criado para evitar estado inconsistente
            try {
              await user.deleteById(newUser.id);
            } catch (rollbackError) {
              console.error(`[VINCULAÇÃO] ❌ Erro no rollback:`, rollbackError);
            }

            // Re-throw o erro para o cliente
            throw terapeutaError;
          }
        }
      } catch (error) {
        console.error(
          "[VINCULAÇÃO] ❌ Erro ao vincular usuário ao terapeuta:",
          error,
        );
        // Não falhar o registro por causa disso, apenas logar o erro
      }
    }

    return response.status(201).json(newUser);
  } catch (error) {
    console.error("Erro ao criar usuário:", error);

    // Passar os erros de validação diretamente para o cliente
    if (error.name === "ValidationError") {
      return response.status(400).json(error);
    }

    return response.status(500).json({ error: "Erro ao criar usuário" });
  }
}
