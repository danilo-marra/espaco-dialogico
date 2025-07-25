import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import paciente from "models/paciente.js";
import { formidable } from "formidable";
import authMiddleware from "utils/authMiddleware.js";
import { requirePermission } from "utils/roleMiddleware.js";
import { requireTerapeutaAccess } from "utils/terapeutaMiddleware.js";

// Configuração para desativar o bodyParser padrão do Next.js para uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

function getFormValue(field) {
  return Array.isArray(field) ? field[0] : field;
}

const router = createRouter();

// Aplicar middleware de autenticação e autorização para proteger as rotas
router.use(authMiddleware).use(requirePermission("pacientes"));
router.use(requireTerapeutaAccess());

router.get(getAllHandler);
router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function getAllHandler(request, response) {
  try {
    // Verificar se é um terapeuta e filtrar adequadamente
    const userRole = request.user?.role;
    const terapeutaId = request.terapeutaId; // Vem do middleware terapeutaMiddleware

    let pacientes;

    // Se for terapeuta, buscar apenas seus pacientes
    if (userRole === "terapeuta" && terapeutaId) {
      pacientes = await paciente.getByTerapeutaId(terapeutaId);
    } else {
      // Admin e secretaria veem todos os pacientes
      pacientes = await paciente.getAll();
    }

    return response.status(200).json(pacientes);
  } catch (error) {
    console.error("Erro ao buscar pacientes:", error);
    return response.status(500).json({ error: "Erro ao buscar pacientes" });
  }
}

async function postHandler(request, response) {
  // Configurar formidable para análise de formulários multipart
  const form = formidable({
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
  });

  try {
    // Parsing com a API atual
    const [fields] = await new Promise((resolve, reject) => {
      form.parse(request, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    // Preparar objeto paciente para inserção com os campos corretos
    const pacienteData = {
      nome: getFormValue(fields.nome),
      dt_nascimento: getFormValue(fields.dt_nascimento) || null,
      terapeuta_id: getFormValue(fields.terapeuta_id),
      nome_responsavel: getFormValue(fields.nome_responsavel),
      telefone_responsavel: getFormValue(fields.telefone_responsavel),
      email_responsavel: getFormValue(fields.email_responsavel),
      cpf_responsavel: getFormValue(fields.cpf_responsavel),
      endereco_responsavel: getFormValue(fields.endereco_responsavel),
      origem: getFormValue(fields.origem) || null,
      dt_entrada: getFormValue(fields.dt_entrada),
    };

    // Validação dos campos obrigatórios (removendo dt_nascimento e origem)
    const requiredFields = [
      "nome",
      "terapeuta_id",
      "nome_responsavel",
      "telefone_responsavel",
      "email_responsavel",
      "cpf_responsavel",
      "endereco_responsavel",
    ];

    for (const field of requiredFields) {
      if (!pacienteData[field]) {
        throw new Error(`Campo obrigatório não preenchido: ${field}`);
      }
    }

    // Criar paciente no banco de dados
    const novoPaciente = await paciente.create(pacienteData);
    return response.status(201).json(novoPaciente);
  } catch (error) {
    console.error("Erro ao criar paciente:", error);
    return response
      .status(500)
      .json({ error: error.message || "Erro ao criar paciente" });
  }
}
