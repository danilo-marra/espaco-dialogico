import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import invite from "models/invite.js";
import user from "models/user.js";
import { requirePermission } from "utils/roleMiddleware.js";

const router = createRouter();

// Aplicar middleware de autenticação e autorização para proteger as rotas
router.use(requirePermission("convites"));
router.get(getHandler);
router.post(postHandler);

export default router.handler(controller.errorHandlers);

// Listar todos os convites
async function getHandler(request, response) {
  try {
    const invites = await invite.getAll();
    return response.status(200).json(invites);
  } catch (error) {
    console.error("Erro ao buscar convites:", error);
    return response.status(500).json({ error: "Erro ao buscar convites" });
  }
}

// Criar um novo convite
async function postHandler(request, response) {
  // Verificar se o usuário é um administrador
  if (request.user.role !== "admin") {
    return response.status(403).json({
      error: "Acesso negado",
      action: "Apenas administradores podem criar convites",
    });
  }

  const { email, role, expiresInDays } = request.body;
  const userId = request.user.id;
  const username = request.user.username;

  try {
    // Se um email foi fornecido, verificar se já existe um usuário com esse email
    if (email && email.trim()) {
      try {
        await user.findOneByEmail(email.trim());
        // Se chegou até aqui, o usuário já existe
        return response.status(400).json({
          error: "Email já cadastrado",
          action:
            "Este email já possui uma conta ativa no sistema. A pessoa pode fazer login diretamente ou solicitar recuperação de senha se necessário.",
          details:
            "Não é possível criar convites para emails já cadastrados para evitar duplicação de contas.",
        });
      } catch (error) {
        // Se o erro for NotFoundError, significa que o email não existe (o que é o que queremos)
        if (error.name !== "NotFoundError") {
          // Se for outro tipo de erro, lançar novamente
          throw error;
        }
        // Email não existe, podemos continuar
      }
    }

    // Verificar se o ID do usuário existe no banco de dados
    let userExists = false;
    let userRecord = null;

    // Tentar buscar o usuário sem lançar erros para o console
    if (userId) {
      try {
        userRecord = await user.findById(userId);
        userExists = true;
      } catch (error) {
        // Silenciosamente ignora o erro de ID não encontrado
      }
    }

    // Se não encontrou pelo ID e temos um username, tenta pelo username
    if (!userExists && username) {
      try {
        userRecord = await user.findOneByUsername(username);
        userExists = true;
      } catch (error) {
        // Silenciosamente ignora o erro de username não encontrado
      }
    }

    // Se o usuário não existe, criar o convite sem o createdBy
    const newInvite = await invite.create({
      email,
      role: role || "secretaria",
      expiresInDays: parseInt(expiresInDays, 10) || 7,
      createdBy: userExists ? userRecord.id || userId : null,
    });

    return response.status(201).json(newInvite);
  } catch (error) {
    console.error("Erro ao criar convite:", error);
    // Adicionar detalhes do erro para depuração
    return response.status(500).json({
      error: "Erro ao criar convite",
      details:
        process.env.NODE_ENV !== "production" ? error.message : undefined,
    });
  }
}
